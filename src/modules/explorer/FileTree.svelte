<script lang="ts">
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { files, type FileEntry } from "$lib/stores/files";
  import { workbench, activeWorkbenchTab, workbenchEditorTabId } from "$lib/stores/workbench";
  import {
    listDir,
    readFile,
    getWorkspacePath,
    getLanguageFromPath,
    isTauriAvailable,
    deleteEntry,
    renameEntry,
  } from "$lib/ipc";
  import { applyWorkspaceFolder, normalizeFileEntry } from "$lib/workspace";
  import { normalizeFilePath } from "$lib/fsPath";
  import FileTreeRow from "./FileTreeRow.svelte";

  let loading = $state(true);
  let error = $state<string | null>(null);
  let browserMode = $state(false);
  let highlightPath = $state<string | null>(null);
  let ctxMenu = $state<{ x: number; y: number; entry: FileEntry } | null>(null);

  async function reloadWorkspaceTree() {
    const ws = get(files).workspacePath;
    if (!ws || browserMode) return;
    try {
      const raw = await listDir(ws);
      files.setTree(raw.map((c) => normalizeFileEntry(c as FileEntry & { isDir?: boolean })));
    } catch (e) {
      console.error(e);
    }
  }

  async function revealPathInTree(absPath: string) {
    const ws = get(files).workspacePath?.replace(/\/$/, "") ?? "";
    if (!ws || !absPath.startsWith(ws)) return;
    highlightPath = normalizeFilePath(absPath);
    const rel = normalizeFilePath(absPath).slice(ws.length).replace(/^\//, "");
    const parts = rel.split("/").filter(Boolean);
    let prefix = ws;
    for (let i = 0; i < parts.length - 1; i++) {
      prefix = `${prefix}/${parts[i]}`;
      try {
        const raw = await listDir(prefix);
        const children = raw.map((c) => normalizeFileEntry(c as FileEntry & { isDir?: boolean }));
        files.setChildren(prefix, children);
      } catch {
        return;
      }
    }
  }

  $effect(() => {
    const tab = $activeWorkbenchTab;
    if (tab?.kind === "editor") {
      void revealPathInTree(tab.path);
    }
  });

  function onRowContext(entry: FileEntry, x: number, y: number) {
    ctxMenu = { x, y, entry };
  }

  function closeCtx() {
    ctxMenu = null;
  }

  async function ctxDelete() {
    const e = ctxMenu?.entry;
    closeCtx();
    if (!e || e.is_dir || !isTauriAvailable()) return;
    if (!confirm(`Delete “${e.name}”? This cannot be undone.`)) return;
    try {
      await deleteEntry(e.path);
      await reloadWorkspaceTree();
    } catch (err) {
      console.error(err);
    }
  }

  async function ctxRename() {
    const e = ctxMenu?.entry;
    closeCtx();
    if (!e || e.is_dir || !isTauriAvailable()) return;
    const next = window.prompt("New file name", e.name);
    if (!next || next === e.name) return;
    const parent = e.path.slice(0, -e.name.length).replace(/\/$/, "");
    const dest = parent ? `${parent}/${next}` : next;
    try {
      await renameEntry(e.path, dest);
      await reloadWorkspaceTree();
    } catch (err) {
      console.error(err);
    }
  }

  onMount(async () => {
    if (!isTauriAvailable()) {
      browserMode = true;
      loading = false;
      return;
    }

    try {
      const workspace = await getWorkspacePath();
      await applyWorkspaceFolder(workspace);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  });

  async function handleToggle(entry: FileEntry) {
    if (!entry.is_dir) return;

    if (entry.expanded && entry.children) {
      files.toggleExpanded(entry.path);
    } else {
      try {
        const raw = await listDir(entry.path);
        const children = raw.map((c) => normalizeFileEntry(c as FileEntry & { isDir?: boolean }));
        files.setChildren(entry.path, children);
      } catch (e) {
        console.error("Failed to list directory:", e);
      }
    }
  }

  async function handleActivate(entry: FileEntry) {
    if (entry.is_dir) {
      await handleToggle(entry);
      return;
    }

    try {
      const content = await readFile(entry.path);
      files.openFile({
        path: entry.path,
        name: entry.name,
        content,
        isDirty: false,
        language: getLanguageFromPath(entry.path),
      });
      workbench.ensureEditorTab(entry.path, entry.name);
      workbench.syncFromOpenFiles();
      workbench.setActiveTab(workbenchEditorTabId(entry.path));
    } catch (e) {
      console.error("Failed to read file:", e);
    }
  }

  /** VS Code / Cursor codicon names for the explorer tree. */
  function getCodicon(entry: FileEntry): string {
    if (entry.is_dir) {
      return entry.expanded ? "codicon-folder-opened" : "codicon-folder";
    }
    const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte", "html", "htm"].includes(ext)) {
      return "codicon-file-code";
    }
    if (ext === "json" || ext === "jsonc") return "codicon-json";
    if (ext === "md" || ext === "mdx") return "codicon-markdown";
    if (ext === "py") return "codicon-python";
    if (["css", "scss", "less"].includes(ext)) return "codicon-symbol-color";
    return "codicon-file";
  }
</script>

<svelte:window onpointerdown={closeCtx} />

<div class="file-tree">
  {#if loading}
    <div class="loading">Loading files...</div>
  {:else if browserMode}
    <div class="browser-mode">
      <p>Browser Mode</p>
      <p class="hint">Run with <code>npm run tauri dev</code> to access files</p>
    </div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="tree-content">
      {#if $files.tree.length === 0}
        <p class="tree-empty">This folder is empty (hidden names like <code>.git</code> are filtered).</p>
      {:else}
        {#each $files.tree as entry (entry.path)}
          <FileTreeRow
            {entry}
            depth={0}
            onActivate={handleActivate}
            {getCodicon}
            highlightPath={highlightPath}
            onContextMenu={onRowContext}
          />
        {/each}
      {/if}
    </div>
  {/if}
  {#if ctxMenu}
    <div
      class="ctx-menu"
      style="left: {ctxMenu.x}px; top: {ctxMenu.y}px;"
      role="menu"
      tabindex="0"
      onpointerdown={(e) => e.stopPropagation()}
    >
      {#if !ctxMenu.entry.is_dir}
        <button type="button" class="ctx-item" onclick={() => void ctxRename()}>Rename…</button>
        <button type="button" class="ctx-item danger" onclick={() => void ctxDelete()}>Delete</button>
      {:else}
        <span class="ctx-muted">Folder actions — soon</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .file-tree {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    width: 100%;
    background: var(--sidebar);
    color: var(--sidebar-foreground);
    overflow: hidden;
  }

  .loading,
  .error {
    padding: 16px;
    color: var(--muted-foreground);
    font-size: 13px;
  }

  .error {
    color: var(--destructive);
  }

  .browser-mode {
    padding: 16px;
    text-align: center;
  }

  .browser-mode p {
    color: var(--muted-foreground);
    font-size: 13px;
    margin: 0;
  }

  .browser-mode .hint {
    margin-top: 8px;
    font-size: 11px;
  }

  .browser-mode code {
    background: var(--muted);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }

  .tree-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0;
  }

  .tree-empty {
    margin: 12px 16px;
    font-size: 12px;
    line-height: 1.45;
    color: var(--muted-foreground);
  }

  .tree-empty code {
    font-size: 11px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--muted);
    color: var(--foreground);
  }

  .ctx-menu {
    position: fixed;
    z-index: 50;
    min-width: 140px;
    background: var(--popover, var(--sidebar));
    border: 1px solid var(--sidebar-border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    padding: 4px;
    font-size: 12px;
  }

  .ctx-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .ctx-item:hover {
    background: var(--sidebar-accent);
  }

  .ctx-item.danger {
    color: var(--destructive, #f87171);
  }

  .ctx-muted {
    display: block;
    padding: 6px 10px;
    color: var(--muted-foreground);
  }
</style>
