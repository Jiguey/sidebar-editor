// @ts-nocheck — stubs HTMLElement / KeyboardEvent for node environment
import { describe, it, expect, beforeAll } from "vitest";

// Stub browser globals missing in node.
beforeAll(() => {
  if (typeof globalThis.HTMLElement === "undefined") {
    globalThis.HTMLElement = class {};
  }
  if (typeof globalThis.KeyboardEvent === "undefined") {
    globalThis.KeyboardEvent = class {
      constructor(type: string, init: Record<string, unknown> = {}) {
        Object.assign(this, { type, ...init });
      }
    };
  }
});

import {
  normalizeKeyEvent,
  buildActiveBindings,
  invertBindings,
  findConflict,
} from "../../src/modules/shortcuts/keybindingHelpers";
import type { ShortcutId } from "../../src/modules/shortcuts/defaults";
import { SHORTCUT_DEFAULTS } from "../../src/modules/shortcuts/defaults";

// ---------------------------------------------------------------------------
// normalizeKeyEvent
// ---------------------------------------------------------------------------

function fakeEv(opts: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): KeyboardEvent {
  return {
    key: opts.key,
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
  } as KeyboardEvent;
}

describe("normalizeKeyEvent", () => {
  it("Ctrl+Shift+F → Mod+Shift+F", () => {
    // Mod first, then Alt (none), then Shift, then key
    expect(normalizeKeyEvent(fakeEv({ key: "F", ctrlKey: true, shiftKey: true }))).toBe("Mod+Shift+F");
  });

  it("Cmd+B → Mod+B", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "b", metaKey: true }))).toBe("Mod+B");
  });

  it("Alt+Shift+T → Alt+Shift+T", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "t", altKey: true, shiftKey: true }))).toBe("Alt+Shift+T");
  });

  it("Ctrl+Enter → Mod+Enter", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "Enter", ctrlKey: true }))).toBe("Mod+Enter");
  });

  it("Escape → Escape (no modifiers)", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "Escape" }))).toBe("Escape");
  });

  it("pure modifier (Shift alone) → empty string", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "Shift", shiftKey: true }))).toBe("");
  });

  it("pure modifier (Control alone) → empty string", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "Control", ctrlKey: true }))).toBe("");
  });

  it("Ctrl+, → Mod+,", () => {
    expect(normalizeKeyEvent(fakeEv({ key: ",", ctrlKey: true }))).toBe("Mod+,");
  });

  it("F5 → F5", () => {
    expect(normalizeKeyEvent(fakeEv({ key: "F5" }))).toBe("F5");
  });
});

// ---------------------------------------------------------------------------
// buildActiveBindings
// ---------------------------------------------------------------------------

describe("buildActiveBindings", () => {
  it("returns default bindings when no overrides", () => {
    const active = buildActiveBindings({});
    for (const row of SHORTCUT_DEFAULTS) {
      expect(active[row.id]).toBe(row.keys);
    }
  });

  it("overrides take priority over defaults", () => {
    const id = SHORTCUT_DEFAULTS[0].id;
    const overrides = { [id]: "Mod+Z" } as Partial<Record<ShortcutId, string>>;
    const active = buildActiveBindings(overrides);
    expect(active[id]).toBe("Mod+Z");
  });

  it("non-overridden entries still use defaults", () => {
    const rows = SHORTCUT_DEFAULTS;
    const overrides = { [rows[0].id]: "Mod+Z" } as Partial<Record<ShortcutId, string>>;
    const active = buildActiveBindings(overrides);
    // Second entry unchanged
    expect(active[rows[1].id]).toBe(rows[1].keys);
  });
});

// ---------------------------------------------------------------------------
// invertBindings
// ---------------------------------------------------------------------------

describe("invertBindings", () => {
  it("maps key strings to action IDs", () => {
    const active = buildActiveBindings({});
    const map = invertBindings(active);
    for (const row of SHORTCUT_DEFAULTS) {
      expect(map.get(row.keys)).toBe(row.id);
    }
  });

  it("first entry wins on collision", () => {
    const bindings = {
      toggleChat: "Mod+B",
      toggleExplorer: "Mod+B",
    } as Record<ShortcutId, string>;
    const map = invertBindings(bindings);
    expect(map.get("Mod+B")).toBe("toggleChat");
  });
});

// ---------------------------------------------------------------------------
// findConflict
// ---------------------------------------------------------------------------

describe("findConflict", () => {
  it("returns null when no other action uses the key", () => {
    const freeKey = "Mod+Shift+Z"; // unused key
    const id = SHORTCUT_DEFAULTS[0].id;
    expect(findConflict(freeKey, id, {})).toBeNull();
  });

  it("returns conflicting action ID when another action already uses the key", () => {
    // Use the real default key of the second action, rebind first action to it.
    const rows = SHORTCUT_DEFAULTS;
    const targetKey = rows[1].keys; // second action's default key
    const rebindingId = rows[0].id; // rebind first action to collide
    const conflict = findConflict(targetKey, rebindingId, {});
    expect(conflict).toBe(rows[1].id);
  });

  it("does not report self-conflict", () => {
    const row = SHORTCUT_DEFAULTS[0];
    // Rebinding to your own current key should not be a conflict.
    expect(findConflict(row.keys, row.id, {})).toBeNull();
  });

  it("detects conflict through overrides", () => {
    const rows = SHORTCUT_DEFAULTS;
    // Override action[1] to use "Mod+Z", then rebind action[0] to "Mod+Z".
    const overrides = { [rows[1].id]: "Mod+Z" } as Partial<Record<ShortcutId, string>>;
    expect(findConflict("Mod+Z", rows[0].id, overrides)).toBe(rows[1].id);
  });
});

// ---------------------------------------------------------------------------
// registry rebind / reset (pure logic, localStorage not needed in node)
// ---------------------------------------------------------------------------

describe("rebind and resetBinding (store logic)", () => {
  it("rebind stores override, resetBinding removes it", async () => {
    // Stub localStorage for the registry module.
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    } as unknown as Storage;

    const { shortcutOverrides, rebind, resetBinding } = await import(
      "../../src/modules/shortcuts/registry"
    );

    const id = SHORTCUT_DEFAULTS[0].id;
    const { get } = await import("svelte/store");

    rebind(id, "Mod+Z");
    expect(get(shortcutOverrides)[id]).toBe("Mod+Z");

    resetBinding(id);
    expect(get(shortcutOverrides)[id]).toBeUndefined();
  });
});
