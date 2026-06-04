import { describe, expect, it } from "vitest";
import {
  defaultChatAppearance,
  normalizeChatAppearance,
} from "../../src/lib/chat/chatAppearance";

describe("chatAppearance", () => {
  it("defaults to spinner-row waiting style", () => {
    expect(defaultChatAppearance().waitingStyle).toBe("spinner-row");
  });

  it("normalizes colors and waiting style", () => {
    const a = normalizeChatAppearance({
      waitingStyle: "dots",
      toolDoneColor: "#abc",
      messageBoxBg: "#123456",
    });
    expect(a.waitingStyle).toBe("dots");
    expect(a.toolDoneColor).toBe("#aabbcc");
    expect(a.messageBoxBg).toBe("#123456");
  });
});
