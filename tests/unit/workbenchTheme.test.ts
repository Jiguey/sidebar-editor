import { describe, expect, it } from "vitest";
import { normalizeWorkbenchTheme } from "../../src/lib/workbench-theme";

describe("normalizeWorkbenchTheme", () => {
  it("defaults to vscode-dark", () => {
    expect(normalizeWorkbenchTheme(undefined)).toBe("vscode-dark");
    expect(normalizeWorkbenchTheme("unknown")).toBe("vscode-dark");
  });

  it("keeps cursor-dark as a selectable preset", () => {
    expect(normalizeWorkbenchTheme("cursor-dark")).toBe("cursor-dark");
  });
});
