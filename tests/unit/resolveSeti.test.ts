import { describe, it, expect } from "vitest";
import {
  resolveSetiIcon,
  setiFontCharacterToChar,
} from "../../src/lib/icon-packs/resolveSeti";
import type { SetiIconManifest } from "../../src/lib/icon-packs/setiTypes";

const mini: SetiIconManifest = {
  iconDefinitions: {
    _default: { fontCharacter: "\\E023", fontColor: "#d4d4d4" },
    _typescript: { fontCharacter: "\\E099", fontColor: "#519aba" },
  },
  file: "_default",
  fileExtensions: { ts: "_typescript" },
  fileNames: {},
};

describe("resolveSeti", () => {
  it("converts Seti font escape to character", () => {
    const ch = setiFontCharacterToChar("\\E099");
    expect(ch.codePointAt(0).toString(16)).toBe("e099");
  });

  it("resolves extension to colored glyph", () => {
    const def = resolveSetiIcon(mini, "app.ts", false);
    expect(def?.fontColor).toBe("#519aba");
    expect(setiFontCharacterToChar(def!.fontCharacter).length).toBeGreaterThan(0);
  });
});

describe("resolveSeti with languageIds", () => {
  it("uses languageIds for common extensions (not generic default)", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolveSetiIconId } = await import("../../src/lib/icon-packs/resolveSeti");
    const raw = readFileSync("static/icon-packs/seti/manifest.json", "utf-8");
    const manifest = JSON.parse(raw);

    expect(resolveSetiIconId(manifest, "app.ts", false)).toBe("_typescript");
    expect(resolveSetiIconId(manifest, "main.rs", false)).toBe("_rust");
    expect(resolveSetiIconId(manifest, "package.json", false)).toBe("_json");
    expect(resolveSetiIconId(manifest, "styles.css", false)).toBe("_css");
    expect(resolveSetiIconId(manifest, "index.html", false)).toBe("_html_3");
    expect(resolveSetiIconId(manifest, "App.tsx", false)).toBe("_react");
  });
});
