import { get, writable } from "svelte/store";
import type { ShortcutId } from "./defaults";

const STORAGE_KEY = "sidebar.shortcuts.v1";

function load(): Partial<Record<ShortcutId, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<ShortcutId, string>>;
  } catch {
    return {};
  }
}

/** User overrides: only entries that differ from defaults are stored. */
export const shortcutOverrides = writable<Partial<Record<ShortcutId, string>>>(load());

shortcutOverrides.subscribe((v) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* storage quota */
  }
});

/** Set a custom binding for one action. Pass null / undefined to reset to default. */
export function rebind(id: ShortcutId, keyString: string | null) {
  shortcutOverrides.update((prev) => {
    const next = { ...prev };
    if (keyString == null) {
      delete next[id];
    } else {
      next[id] = keyString;
    }
    return next;
  });
}

/** Reset one action binding to its default. */
export function resetBinding(id: ShortcutId) {
  rebind(id, null);
}

/** Reset all bindings to defaults. */
export function resetShortcutOverrides() {
  shortcutOverrides.set({});
}

/** Returns the current merged overrides object (snapshot). */
export function getOverrides(): Partial<Record<ShortcutId, string>> {
  return get(shortcutOverrides);
}
