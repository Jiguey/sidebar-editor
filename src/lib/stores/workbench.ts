import { writable, derived, get } from "svelte/store";
import { ptyClose } from "../ipc";
import { normalizeFilePath } from "../fsPath";
import { files, type OpenFile } from "./files";

export type WorkbenchTabKind = "editor" | "terminal" | "preview";

export type WorkbenchTab =
  | {
      id: string;
      kind: "editor";
      title: string;
      path: string;
    }
  | {
      id: string;
      kind: "terminal";
      title: string;
      sessionId: string;
    }
  | {
      id: string;
      kind: "preview";
      title: string;
      url: string;
    };

function editorTabId(path: string) {
  return `editor:${normalizeFilePath(path)}`;
}

/** Stable id for the editor tab that shows `path` (used when forcing focus after open). */
export function workbenchEditorTabId(path: string) {
  return editorTabId(path);
}

function normalizePersistedTab(tab: WorkbenchTab): WorkbenchTab {
  if (tab.kind !== "editor") return tab;
  const path = normalizeFilePath(tab.path);
  return { ...tab, id: editorTabId(path), path };
}

function createWorkbenchStore() {
  const stateWritable = writable<{
    tabs: WorkbenchTab[];
    activeTabId: string | null;
  }>({
    tabs: [],
    activeTabId: null,
  });

  return {
    subscribe: stateWritable.subscribe,
    /** Restore editor tabs into `files` store (disk content). Call once at startup after workspace path is known. */
    async hydrateEditorTabs(loadFile: (path: string) => Promise<string>) {
      const state = get(stateWritable);
      const editorTabs = state.tabs.filter((t): t is Extract<WorkbenchTab, { kind: "editor" }> => t.kind === "editor");
      for (const t of editorTabs) {
        const tp = normalizeFilePath(t.path);
        const existing = get(files).openFiles.find((f) => normalizeFilePath(f.path) === tp);
        if (!existing) {
          try {
            const content = await loadFile(tp);
            const name = tp.split("/").pop() ?? tp;
            const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
            const language =
              ext === "ts"
                ? "typescript"
                : ext === "js" || ext === "jsx"
                  ? "javascript"
                  : ext === "rs"
                    ? "rust"
                    : ext === "py"
                      ? "python"
                      : ext === "json"
                        ? "json"
                        : ext === "md"
                          ? "markdown"
                          : ext === "css"
                            ? "css"
                            : ext === "html"
                              ? "html"
                              : "plaintext";
            files.openFile({
              path: tp,
              name,
              content,
              isDirty: false,
              language,
            });
          } catch {
            /* missing path — dropped below */
          }
        }
      }
      stateWritable.update((s) => {
        const validPaths = new Set(get(files).openFiles.map((f) => normalizeFilePath(f.path)));
        const tabs = s.tabs.filter(
          (tab) => tab.kind !== "editor" || validPaths.has(normalizeFilePath(tab.path))
        );
        let activeTabId = s.activeTabId;
        if (activeTabId && !tabs.some((t) => t.id === activeTabId)) {
          const ap = get(files).activeFilePath;
          const fromFile = ap != null ? editorTabId(ap) : null;
          if (fromFile && tabs.some((t) => t.id === fromFile)) {
            activeTabId = fromFile;
          } else {
            const firstEditor = tabs.find((t) => t.kind === "editor");
            activeTabId = firstEditor?.id ?? (tabs.length ? tabs[tabs.length - 1].id : null);
          }
        }
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab?.kind === "editor") {
          files.setActiveFile(activeTab.path);
        }
        return { tabs, activeTabId };
      });
    },
  /** Open or focus an editor tab and ensure the in-memory buffer exists. */
    openEditorFile(file: OpenFile) {
      const canon = normalizeFilePath(file.path);
      const stored: OpenFile = { ...file, path: canon };
      files.openFile(stored);
      stateWritable.update((s) => {
        const id = editorTabId(canon);
        const exists = s.tabs.find((t) => t.id === id);
        const label = stored.name || canon.split("/").pop() || canon;
        if (exists) {
          return { ...s, activeTabId: id };
        }
        return {
          tabs: [...s.tabs, { id, kind: "editor" as const, path: canon, title: label }],
          activeTabId: id,
        };
      });
      files.setActiveFile(canon);
    },
    ensureEditorTab(path: string, title?: string) {
      const canon = normalizeFilePath(path);
      const existing = get(files).openFiles.find((f) => normalizeFilePath(f.path) === canon);
      if (existing) {
        this.openEditorFile(existing);
        return;
      }
      stateWritable.update((s) => {
        const id = editorTabId(canon);
        const exists = s.tabs.find((t) => t.id === id);
        const label = title ?? canon.split("/").pop() ?? canon;
        if (exists) {
          return { ...s, activeTabId: id };
        }
        return {
          tabs: [...s.tabs, { id, kind: "editor" as const, path: canon, title: label }],
          activeTabId: id,
        };
      });
      files.setActiveFile(canon);
    },
    addTerminalTab(sessionId: string, title = "Terminal") {
      const id = `terminal:${sessionId}`;
      stateWritable.update((s) => ({
        tabs: [...s.tabs, { id, kind: "terminal" as const, sessionId, title }],
        activeTabId: id,
      }));
      return id;
    },
    addPreviewTab(url: string, title = "Preview") {
      const id = `preview:${encodeURIComponent(url)}`;
      stateWritable.update((s) => {
        const withoutDup = s.tabs.filter((t) => t.id !== id);
        return {
          tabs: [...withoutDup, { id, kind: "preview" as const, url, title }],
          activeTabId: id,
        };
      });
      return id;
    },
    setActiveTab(id: string | null) {
      stateWritable.update((s) => ({ ...s, activeTabId: id }));
      if (!id || !id.startsWith("editor:")) return;
      const path = normalizeFilePath(id.slice("editor:".length));
      files.setActiveFile(path);
    },
    closeTab(id: string) {
      stateWritable.update((s) => {
        const tab = s.tabs.find((t) => t.id === id);
        const tabs = s.tabs.filter((t) => t.id !== id);
        let activeTabId = s.activeTabId;
        if (activeTabId === id) {
          const idx = s.tabs.findIndex((t) => t.id === id);
          const neighbor = tabs[idx - 1] ?? tabs[idx] ?? tabs[tabs.length - 1] ?? null;
          activeTabId = neighbor?.id ?? null;
        }
        if (tab?.kind === "editor") {
          files.closeFile(tab.path);
        } else if (tab?.kind === "terminal") {
          void ptyClose(tab.sessionId);
        }
        return { tabs, activeTabId };
      });
      const next = get(stateWritable).activeTabId;
      if (next?.startsWith("editor:")) {
        files.setActiveFile(next.slice("editor:".length));
      }
    },
    syncFromOpenFiles() {
      stateWritable.update((s) => ({
        ...s,
        tabs: s.tabs.map((t) => {
          if (t.kind !== "editor") return t;
          const tp = normalizeFilePath(t.path);
          const f = get(files).openFiles.find((o) => normalizeFilePath(o.path) === tp);
          return f ? { ...t, title: f.name } : t;
        }),
      }));
    },
    replaceProjectState(snapshot: {
      tabs: WorkbenchTab[];
      activeTabId: string | null;
    }) {
      const tabs = snapshot.tabs.map(normalizePersistedTab);
      let activeTabId = snapshot.activeTabId;
      if (activeTabId?.startsWith("editor:")) {
        activeTabId = editorTabId(activeTabId.slice("editor:".length));
      }
      if (activeTabId && !tabs.some((t) => t.id === activeTabId)) {
        activeTabId = tabs[0]?.id ?? null;
      }
      stateWritable.set({ tabs, activeTabId });
    },
    reset() {
      stateWritable.set({ tabs: [], activeTabId: null });
    },
    /** Close every center tab; releases PTYs and editor buffers (same as closing each tab). */
    closeAllTabs() {
      const s = get(stateWritable);
      for (const tab of s.tabs) {
        if (tab.kind === "editor") {
          files.closeFile(tab.path);
        } else if (tab.kind === "terminal") {
          void ptyClose(tab.sessionId);
        }
      }
      stateWritable.set({ tabs: [], activeTabId: null });
    },
  };
}

export const workbench = createWorkbenchStore();

export const activeWorkbenchTab = derived(workbench, ($w) =>
  $w.tabs.find((t) => t.id === $w.activeTabId) ?? null
);

/** Open buffer for the active editor tab (tab path is source of truth, not activeFilePath alone). */
export const activeEditorFile = derived([workbench, files], ([$w, $f]) => {
  const tab = $w.tabs.find((t) => t.id === $w.activeTabId);
  if (!tab || tab.kind !== "editor") return null;
  const key = normalizeFilePath(tab.path);
  return $f.openFiles.find((file) => normalizeFilePath(file.path) === key) ?? null;
});
