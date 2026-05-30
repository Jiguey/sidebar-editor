import { describe, it, expect } from "vitest";
import {
  countTokens,
  estimateChatContextTokens,
  estimateInflightContextTokens,
} from "../../src/lib/chatContext";

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

  it("counts thinking and tool calls on stored messages", () => {
    const base = estimateChatContextTokens([{ role: "assistant", content: "ok" }], "");
    const rich = estimateChatContextTokens(
      [
        {
          role: "assistant",
          content: "ok",
          thinking: "long reasoning ".repeat(20),
          rawToolCalls: [{ name: "read_file", arguments: '{"path":"x"}' }],
        },
      ],
      ""
    );
    expect(rich).toBeGreaterThan(base);
  });

  it("estimateInflightContextTokens avoids double-counting stream vs response", () => {
    const once = estimateInflightContextTokens({
      streamingContent: "hello",
      response: "hello",
    });
    const streamOnly = estimateInflightContextTokens({ streamingContent: "hello" });
    expect(once).toBe(streamOnly);
  });
});
