import { describe, expect, it } from "vitest";
import {
  shouldRunSynthesis,
  toolResultsAreSelfExplanatory,
} from "../../src/lib/agent/synthesis";

describe("shouldRunSynthesis", () => {
  it("runs when tools executed but no summary delivered", () => {
    expect(shouldRunSynthesis(false, 2)).toBe(true);
  });

  it("skips when summary already delivered", () => {
    expect(shouldRunSynthesis(true, 3)).toBe(false);
  });

  it("skips when no tools ran", () => {
    expect(shouldRunSynthesis(false, 0)).toBe(false);
  });
});

describe("toolResultsAreSelfExplanatory", () => {
  it("returns true for successful file mutations only", () => {
    expect(
      toolResultsAreSelfExplanatory([
        { name: "write_file", success: true },
        { name: "create_file", success: true },
      ])
    ).toBe(true);
  });

  it("returns false when read tools need a summary", () => {
    expect(
      toolResultsAreSelfExplanatory([
        { name: "read_file", success: true },
        { name: "write_file", success: true },
      ])
    ).toBe(false);
  });

  it("returns false when a mutation failed", () => {
    expect(toolResultsAreSelfExplanatory([{ name: "write_file", success: false }])).toBe(
      false
    );
  });
});
