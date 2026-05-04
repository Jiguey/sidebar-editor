import { describe, it, expect } from "vitest";
import { reduceHarnessStreamDisplay } from "../../src/lib/harnessStreamDisplay";

const empty = { streamingContent: "", streamingThinking: "" };

describe("reduceHarnessStreamDisplay (Ollama-style harness → UI)", () => {
  it("updates live assistant text on partial message events", () => {
    const a = reduceHarnessStreamDisplay(empty, "message", {
      role: "assistant",
      content: "Hello",
      done: false,
    });
    expect(a).toEqual({
      kind: "set-stream",
      view: { streamingContent: "Hello", streamingThinking: "" },
    });
  });

  it("keeps prior thinking when a partial message only updates content", () => {
    const prev = { streamingContent: "", streamingThinking: "step 1" };
    const a = reduceHarnessStreamDisplay(prev, "message", {
      role: "assistant",
      content: "Out",
      done: false,
    });
    expect(a).toEqual({
      kind: "set-stream",
      view: { streamingContent: "Out", streamingThinking: "step 1" },
    });
  });

  it("merges thinking stream into the view buffer", () => {
    const a = reduceHarnessStreamDisplay(
      { streamingContent: "x", streamingThinking: "" },
      "thinking",
      { content: "reasoning…" }
    );
    expect(a).toEqual({
      kind: "set-stream",
      view: { streamingContent: "x", streamingThinking: "reasoning…" },
    });
  });

  it("on done message commits assistant bubble with trimmed thinking", () => {
    const prev = { streamingContent: "Answer", streamingThinking: "  trace  \n" };
    const a = reduceHarnessStreamDisplay(prev, "message", {
      role: "assistant",
      content: "Answer",
      done: true,
    });
    expect(a).toEqual({
      kind: "commit-assistant",
      view: { streamingContent: "", streamingThinking: "" },
      content: "Answer",
      thinking: "trace",
    });
  });

  it("omits thinking field when thinking buffer is empty", () => {
    const a = reduceHarnessStreamDisplay(
      { streamingContent: "Only", streamingThinking: "   " },
      "message",
      { role: "assistant", content: "Only", done: true }
    );
    expect(a).toEqual({
      kind: "commit-assistant",
      view: { streamingContent: "", streamingThinking: "" },
      content: "Only",
    });
    expect("thinking" in (a as { thinking?: string })).toBe(false);
  });

  it("clears streaming buffers on stopped", () => {
    const a = reduceHarnessStreamDisplay(
      { streamingContent: "partial", streamingThinking: "t" },
      "stopped",
      {}
    );
    expect(a).toEqual({ kind: "clear-stream" });
  });

  it("surfaces provider errors as assistant error payload", () => {
    const a = reduceHarnessStreamDisplay(empty, "error", { message: "model runner failed" });
    expect(a).toEqual({ kind: "error-assistant", message: "model runner failed" });
  });
});
