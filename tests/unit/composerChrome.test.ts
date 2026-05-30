import { describe, expect, it } from "vitest";
import { resolveComposerChromeState } from "../../src/lib/chat/composerChrome";

describe("composerChrome", () => {
  it("prioritizes working over focused", () => {
    expect(resolveComposerChromeState(true, true)).toBe("working");
  });

  it("returns focused when not streaming", () => {
    expect(resolveComposerChromeState(false, true)).toBe("focused");
  });

  it("returns idle when inactive", () => {
    expect(resolveComposerChromeState(false, false)).toBe("idle");
  });
});
