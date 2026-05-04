import { describe, it, expect } from "vitest";
import {
  toolNeedsUserApproval,
  parseWhitelistInput,
  type ToolPolicyConfig,
} from "../../src/lib/toolPolicy";

describe("toolPolicy", () => {
  it("allow_all never needs approval", () => {
    const p: ToolPolicyConfig = { mode: "allow_all", whitelist: [] };
    expect(toolNeedsUserApproval("run_command", p)).toBe(false);
  });

  it("whitelist prompts when tool not listed", () => {
    const p: ToolPolicyConfig = { mode: "whitelist", whitelist: ["read_file"] };
    expect(toolNeedsUserApproval("read_file", p)).toBe(false);
    expect(toolNeedsUserApproval("run_command", p)).toBe(true);
  });

  it("ask_each always needs approval", () => {
    const p: ToolPolicyConfig = { mode: "ask_each", whitelist: ["read_file"] };
    expect(toolNeedsUserApproval("read_file", p)).toBe(true);
  });

  it("parseWhitelistInput splits commas and newlines", () => {
    expect(parseWhitelistInput("a, b\nc")).toEqual(["a", "b", "c"]);
  });
});
