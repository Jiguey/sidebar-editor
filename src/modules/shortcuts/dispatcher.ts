import { get } from "svelte/store";
import { workbench } from "$lib/stores/workbench";
import type { ShortcutId } from "./defaults";
import { normalizeKeyEvent, buildActiveBindings, invertBindings } from "./keybindingHelpers";

export type ShortcutHandlers = {
  toggleChat: () => void;
  toggleExplorer: () => void;
  toggleBottom: () => void;
  openSettings: () => void;
  newTerminal: () => void | Promise<void>;
  newPreview: () => void;
  closeAllWorkbench: () => void | Promise<void>;
  focusSearch: () => void;
};

function ignoreTarget(ev: EventTarget | null): boolean {
  if (!(ev instanceof HTMLElement)) return false;
  const tag = ev.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(ev.closest(".cm-editor")) || Boolean(ev.closest(".xterm"));
}

/** Returns true if a shortcut was handled (caller should not propagate). */
export function dispatchWorkbenchShortcut(ev: KeyboardEvent, h: ShortcutHandlers): boolean {
  const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;

  if (ev.altKey && ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
    if (key === "t") {
      if (ignoreTarget(ev.target)) return false;
      ev.preventDefault();
      void h.newTerminal();
      return true;
    }
    if (key === "p") {
      if (ignoreTarget(ev.target)) return false;
      ev.preventDefault();
      h.newPreview();
      return true;
    }
    if (key === "x") {
      if (ignoreTarget(ev.target)) return false;
      ev.preventDefault();
      void h.closeAllWorkbench();
      return true;
    }
  }

  const mod = ev.ctrlKey || ev.metaKey;
  if (!mod) return false;

  if (mod && (ev.key === "," || ev.code === "Comma")) {
    ev.preventDefault();
    h.openSettings();
    return true;
  }

  if ((key === "w" || key === "W") && mod && !ev.shiftKey) {
    if (ignoreTarget(ev.target)) return false;
    const id = get(workbench).activeTabId;
    if (!id) return false;
    ev.preventDefault();
    workbench.closeTab(id);
    return true;
  }

  if ((key === "b" || key === "B") && mod && !ev.shiftKey) {
    if (ignoreTarget(ev.target)) return false;
    ev.preventDefault();
    h.toggleChat();
    return true;
  }

  if ((key === "e" || key === "E") && mod && ev.shiftKey) {
    if (ignoreTarget(ev.target)) return false;
    ev.preventDefault();
    h.toggleExplorer();
    return true;
  }

  if ((key === "j" || key === "J") && mod && !ev.shiftKey) {
    if (ignoreTarget(ev.target)) return false;
    ev.preventDefault();
    h.toggleBottom();
    return true;
  }

  if (key === "`" && mod && ev.shiftKey) {
    if (ignoreTarget(ev.target)) return false;
    ev.preventDefault();
    void h.newTerminal();
    return true;
  }

  // Cmd/Ctrl+Shift+F — focus search panel.
  // EditorSurface also handles Cmd+Shift+F for format-document, but only when
  // the cm-editor is focused; ignoreTarget returns true for that case and we
  // short-circuit here, leaving format-document to the editor handler.
  if ((key === "f" || key === "F") && mod && ev.shiftKey) {
    if (ignoreTarget(ev.target)) return false;
    ev.preventDefault();
    h.focusSearch();
    return true;
  }

  return false;
}

/**
 * Checks user overrides first, then falls through to the hardcoded dispatcher.
 * Call this from WorkbenchShell instead of `dispatchWorkbenchShortcut` when
 * `overrides` is non-empty, so rebindings take effect without a reload.
 */
export function dispatchWithOverrides(
  ev: KeyboardEvent,
  h: ShortcutHandlers,
  overrides: Partial<Record<ShortcutId, string>>
): boolean {
  if (Object.keys(overrides).length > 0) {
    const keyStr = normalizeKeyEvent(ev);
    if (keyStr) {
      const active = buildActiveBindings(overrides);
      const byKey = invertBindings(active);
      const actionId = byKey.get(keyStr);
      if (actionId && actionId in h) {
        // Only intercept if the key differs from the hardcoded default.
        if (ignoreTarget(ev.target)) return false;
        ev.preventDefault();
        const fn = h[actionId as keyof ShortcutHandlers];
        void (fn as () => void)();
        return true;
      }
    }
  }
  return dispatchWorkbenchShortcut(ev, h);
}
