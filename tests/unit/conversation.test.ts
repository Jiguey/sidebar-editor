import { describe, it, expect } from "vitest";
import {
  buildProviderMessages,
  appendAssistantToolCalls,
  appendToolResults,
} from "../../src/lib/agent/conversation";
import type { Message as ChatMessage } from "../../src/lib/stores/chat";

describe("conversation", () => {
  it("buildProviderMessages maps user, assistant, and tool roles", () => {
    const history: ChatMessage[] = [
      { id: "1", role: "user", content: "hi", timestamp: 0 },
      {
        id: "2",
        role: "assistant",
        content: "calling tool",
        timestamp: 1,
        rawToolCalls: [{ id: "tc1", name: "read_file", arguments: '{"path":"a.ts"}' }],
      },
      {
        id: "3",
        role: "tool",
        content: "file contents",
        timestamp: 2,
        toolCallId: "tc1",
        toolName: "read_file",
      },
    ];

    const msgs = buildProviderMessages("system", history);
    expect(msgs[0]).toEqual({ role: "system", content: "system" });
    expect(msgs[1]).toEqual({ role: "user", content: "hi" });
    expect(msgs[2].role).toBe("assistant");
    expect(msgs[2].tool_calls?.[0].function.name).toBe("read_file");
    expect(msgs[3]).toEqual({
      role: "tool",
      content: "file contents",
      tool_call_id: "tc1",
    });
  });

  it("appendAssistantToolCalls and appendToolResults extend the thread", () => {
    const base = [{ role: "user" as const, content: "go" }];
    const withAssistant = appendAssistantToolCalls(base, "ok", [
      { id: "x", name: "grep", arguments: '{"pattern":"foo"}' },
    ]);
    expect(withAssistant).toHaveLength(2);
    expect(withAssistant[1].tool_calls?.[0].id).toBe("x");

    const withTool = appendToolResults(withAssistant, [
      { id: "x", name: "grep", content: "matches" },
    ]);
    expect(withTool).toHaveLength(3);
    expect(withTool[2]).toEqual({
      role: "tool",
      content: "matches",
      tool_call_id: "x",
    });
  });
});
