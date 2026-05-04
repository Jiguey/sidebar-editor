import { describe, it, expect } from "vitest";
import { ollamaChatChunksToHarnessEvents } from "../../sidecar/src/ollamaStreamToHarnessEvents.js";

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

describe("ollamaChatChunksToHarnessEvents", () => {
  it("accumulates assistant text and marks final chunk done", async () => {
    async function* chunks() {
      yield {
        message: { content: "Hel" },
        done: false,
      };
      yield {
        message: { content: "lo" },
        done: false,
      };
      yield {
        message: { content: "!" },
        done: true,
        prompt_eval_count: 3,
        eval_count: 2,
      };
    }

    const events = await collect(ollamaChatChunksToHarnessEvents(chunks()));

    const messages = events.filter((e) => e.type === "message");
    expect(messages.map((m) => (m as { content: string; done: boolean }).content)).toEqual([
      "Hel",
      "Hello",
      "Hello!",
    ]);
    expect(messages.map((m) => (m as { done: boolean }).done)).toEqual([false, false, true]);

    const usage = events.filter((e) => e.type === "usage");
    expect(usage).toHaveLength(1);
    expect(usage[0]).toMatchObject({ type: "usage", inputTokens: 3, outputTokens: 2 });
  });

  it("streams thinking separately and emits done thinking before usage", async () => {
    async function* chunks() {
      yield { message: { thinking: "plan", content: "" }, done: false };
      yield { message: { thinking: " A", content: "Hi" }, done: false };
      yield {
        message: { thinking: "", content: "" },
        done: true,
        prompt_eval_count: 1,
        eval_count: 1,
      };
    }

    const events = await collect(ollamaChatChunksToHarnessEvents(chunks()));
    const thinking = events.filter((e) => e.type === "thinking");
    expect(thinking.map((t) => (t as { content: string; done: boolean }).content)).toEqual([
      "plan",
      "plan A",
      "plan A",
    ]);
    expect(thinking.map((t) => (t as { done: boolean }).done)).toEqual([false, false, true]);

    const lastMsg = events.filter((e) => e.type === "message").pop() as { content: string; done: boolean };
    expect(lastMsg).toEqual({ type: "message", role: "assistant", content: "Hi", done: true });
  });

  it("tolerates missing content/thinking fields", async () => {
    async function* chunks() {
      yield { message: {}, done: false };
      yield { message: { content: "x" }, done: true };
    }
    const events = await collect(ollamaChatChunksToHarnessEvents(chunks()));
    const messages = events.filter((e) => e.type === "message");
    expect(messages[0]).toMatchObject({ content: "", done: false });
    expect(messages[1]).toMatchObject({ content: "x", done: true });
  });
});
