import { SHORTCUT_DEFAULTS, type ShortcutId } from "./defaults";

export type KeyString = string; // e.g. "Mod+Shift+F", "Alt+Shift+T", "Mod+,"

/**
 * Normalises a KeyboardEvent into the same `Mod+Shift+Key` format used by
 * `defaults.ts`. Rules:
 *   - ctrlKey OR metaKey → "Mod" (platform-agnostic, matches both)
 *   - shiftKey → "Shift"
 *   - altKey  → "Alt"
 *   - Single printable character → uppercased
 *   - Named keys (Enter, Escape, …) → title-cased, e.g. "Enter"
 *   - Pure modifier keypresses (ctrl alone, etc.) → returns ""
 */
export function normalizeKeyEvent(e: KeyboardEvent): KeyString {
  const PURE_MODIFIERS = new Set(["Control", "Shift", "Alt", "Meta", "OS"]);
  if (PURE_MODIFIERS.has(e.key)) return "";

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Mod");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  // For single characters, uppercase; for named keys (Enter, Escape, …) keep as-is.
  const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(k);
  return parts.join("+");
}

/** Merge default bindings with user overrides (overrides win). */
export function buildActiveBindings(
  overrides: Partial<Record<ShortcutId, string>>
): Record<ShortcutId, KeyString> {
  const result: Partial<Record<ShortcutId, KeyString>> = {};
  for (const row of SHORTCUT_DEFAULTS) {
    result[row.id] = overrides[row.id] ?? row.keys;
  }
  return result as Record<ShortcutId, KeyString>;
}

/** Invert a bindings map: key string → shortcut id (first id wins on collision). */
export function invertBindings(
  bindings: Record<ShortcutId, KeyString>
): Map<KeyString, ShortcutId> {
  const out = new Map<KeyString, ShortcutId>();
  for (const [id, key] of Object.entries(bindings) as [ShortcutId, KeyString][]) {
    if (!out.has(key)) out.set(key, id);
  }
  return out;
}

/**
 * Returns the shortcut ID that conflicts with `keyString` when rebinding
 * `forId` — i.e. another existing action already uses that key. Returns null
 * if no conflict.
 */
export function findConflict(
  keyString: KeyString,
  forId: ShortcutId,
  overrides: Partial<Record<ShortcutId, string>>
): ShortcutId | null {
  const active = buildActiveBindings(overrides);
  for (const [id, key] of Object.entries(active) as [ShortcutId, KeyString][]) {
    if (id !== forId && key === keyString) return id;
  }
  return null;
}
