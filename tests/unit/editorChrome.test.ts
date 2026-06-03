import { describe, expect, it } from "vitest";
import {
  applyEditorChromeToDocument,
  clearEditorChromeInlineOverrides,
  defaultEditorChrome,
  normalizeEditorChrome,
} from "../../src/lib/editor/editorChrome";

describe("editorChrome", () => {
  it("normalizes hex colors", () => {
    const out = normalizeEditorChrome({ bg: "#ABC" });
    expect(out.bg).toBe("#aabbcc");
  });

  it("applyEditorChromeToDocument is safe without document", () => {
    expect(() => applyEditorChromeToDocument(defaultEditorChrome())).not.toThrow();
  });

  it("clearEditorChromeInlineOverrides is safe without document", () => {
    expect(() => clearEditorChromeInlineOverrides()).not.toThrow();
  });
});
