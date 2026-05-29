import { describe, expect, it } from "vitest";
import {
  indexOfUserMessage,
  pathsTouchedAfterUserIndex,
} from "../../src/lib/agent/chatRewind";
import type { Message } from "../../src/lib/stores/chat";

const ws = "/proj";

function msg(partial: Partial<Message> & Pick<Message, "id" | "role" | "content">): Message {
  return {
    timestamp: 0,
    ...partial,
  };
}

describe("chatRewind", () => {
  it("finds user message index", () => {
    const messages = [
      msg({ id: "u1", role: "user", content: "a" }),
      msg({ id: "a1", role: "assistant", content: "b" }),
    ];
    expect(indexOfUserMessage(messages, "u1")).toBe(0);
    expect(indexOfUserMessage(messages, "a1")).toBe(-1);
  });

  it("collects paths from tool messages after user index", () => {
    const messages = [
      msg({ id: "u1", role: "user", content: "go", checkpointOid: "abc" }),
      msg({
        id: "t1",
        role: "tool",
        content: "ok",
        toolName: "write_file",
        toolInput: { path: "src/foo.ts" },
        toolPaths: [`${ws}/src/foo.ts`],
      }),
    ];
    expect(pathsTouchedAfterUserIndex(messages, 0, ws)).toContain(`${ws}/src/foo.ts`);
  });
});
