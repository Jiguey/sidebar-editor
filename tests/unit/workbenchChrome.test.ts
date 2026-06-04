import { describe, expect, it } from "vitest";
import { normalizeWorkbenchChrome } from "../../src/lib/workbench/workbenchChrome";

describe("normalizeWorkbenchChrome", () => {
  it("defaults panel and control colors", () => {
    const colors = normalizeWorkbenchChrome(undefined);
    expect(colors.panelBg).toBe("#252526");
    expect(colors.controlBg).toBe("#2d2d30");
    expect(colors.controlActiveBg).toBe("#3c3c3c");
  });

  it("normalizes short hex", () => {
    const colors = normalizeWorkbenchChrome({ panelBg: "#abc" });
    expect(colors.panelBg).toBe("#aabbcc");
  });
});
