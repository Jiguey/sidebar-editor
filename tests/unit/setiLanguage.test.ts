import { describe, it, expect } from "vitest";
import { setiLanguageIdFromFileName } from "../../src/lib/icon-packs/setiLanguage";

describe("setiLanguageIdFromFileName", () => {
  it("maps TS/JS variants including react", () => {
    expect(setiLanguageIdFromFileName("app.ts")).toBe("typescript");
    expect(setiLanguageIdFromFileName("App.tsx")).toBe("typescriptreact");
    expect(setiLanguageIdFromFileName("index.js")).toBe("javascript");
    expect(setiLanguageIdFromFileName("page.jsx")).toBe("javascriptreact");
  });

  it("maps systems languages", () => {
    expect(setiLanguageIdFromFileName("main.rs")).toBe("rust");
    expect(setiLanguageIdFromFileName("lib.py")).toBe("python");
  });
});
