import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  TOKYO_NIGHT_SYNTAX_DEFAULTS,
  defaultSyntaxColors,
  loadSyntaxColors,
  normalizeSyntaxColors,
  saveSyntaxColors,
} from "../../src/lib/editor/syntaxColors";

describe("syntaxColors", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });

  it("defaults match Tokyo Night palette", () => {
    expect(defaultSyntaxColors()).toEqual({ ...TOKYO_NIGHT_SYNTAX_DEFAULTS });
  });

  it("normalizes short hex and ignores invalid keys", () => {
    const out = normalizeSyntaxColors({ keyword: "#abc", bogus: "#fff" } as never);
    expect(out.keyword).toBe("#aabbcc");
    expect(out.function).toBe(TOKYO_NIGHT_SYNTAX_DEFAULTS.function);
  });

  it("persists and loads from localStorage", () => {
    const custom = { ...defaultSyntaxColors(), string: "#ffffff" };
    saveSyntaxColors(custom);
    expect(loadSyntaxColors().string).toBe("#ffffff");
  });
});
