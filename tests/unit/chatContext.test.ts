import { describe, it, expect } from "vitest";
import { countTokens, estimateChatContextTokens } from "../../src/lib/chatContext";

describe("chatContext", () => {
  it("countTokens returns a positive number for non-empty text", () => {
    expect(countTokens("hello world")).toBeGreaterThan(0);
  });

  it("estimateChatContextTokens sums messages and draft", () => {
    const msgs = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ];
    const a = estimateChatContextTokens(msgs, "");
    const b = estimateChatContextTokens(msgs, "draft");
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
