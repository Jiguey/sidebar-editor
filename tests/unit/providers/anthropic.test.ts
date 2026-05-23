import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { streamChat, ANTHROPIC_MODELS } from "../../../src/lib/providers/anthropic";
import type { Message, Tool, StreamEvent } from "../../../src/lib/providers/openaiCompat";

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

function createMockResponse(
  body: string,
  options: { ok?: boolean; status?: number } = {}
): Response {
  const { ok = true, status = 200 } = options;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });

  return {
    ok,
    status,
    body: stream,
    text: async () => body,
  } as Response;
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

describe("anthropic provider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("ANTHROPIC_MODELS", () => {
    it("contains Claude models", () => {
      expect(ANTHROPIC_MODELS.length).toBeGreaterThan(0);
      const ids = ANTHROPIC_MODELS.map((m) => m.id);
      expect(ids.some((id) => id.includes("claude"))).toBe(true);
    });

    it("each model has id, name, and contextWindow", () => {
      for (const model of ANTHROPIC_MODELS) {
        expect(typeof model.id).toBe("string");
        expect(typeof model.name).toBe("string");
        expect(typeof model.contextWindow).toBe("number");
        expect(model.contextWindow).toBeGreaterThan(0);
      }
    });
  });

  describe("streamChat", () => {
    it("sends request to Anthropic API with correct headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(sseEvent({ type: "message_stop" }))
      );
      global.fetch = mockFetch;

      await collect(streamChat("sk-test-key", "claude-3-sonnet", "System prompt", []));

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-api-key": "sk-test-key",
            "anthropic-version": "2023-06-01",
          }),
        })
      );
    });

    it("converts messages correctly (filters system messages)", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(sseEvent({ type: "message_stop" }))
      );
      global.fetch = mockFetch;

      const messages: Message[] = [
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ];

      await collect(streamChat("key", "model", "System", messages));

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.messages).toEqual([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);
    });

    it("converts tool result messages correctly", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(sseEvent({ type: "message_stop" }))
      );
      global.fetch = mockFetch;

      const messages: Message[] = [
        { role: "user", content: "Read file" },
        { role: "tool", content: "file content", tool_call_id: "call_123" },
      ];

      await collect(streamChat("key", "model", "", messages));

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe("user");
      expect(body.messages[0].content).toEqual([
        { type: "text", text: "Read file" },
        { type: "tool_result", tool_use_id: "call_123", content: "file content" },
      ]);
    });

    it("converts tools to Anthropic format", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(sseEvent({ type: "message_stop" }))
      );
      global.fetch = mockFetch;

      const tools: Tool[] = [
        {
          type: "function",
          function: {
            name: "read_file",
            description: "Read a file",
            parameters: {
              type: "object",
              properties: {
                path: { type: "string", description: "File path" },
              },
              required: ["path"],
            },
          },
        },
      ];

      await collect(streamChat("key", "model", "", [], tools));

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.tools).toEqual([
        {
          name: "read_file",
          description: "Read a file",
          input_schema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path" },
            },
            required: ["path"],
          },
        },
      ]);
    });

    it("includes system prompt when provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(sseEvent({ type: "message_stop" }))
      );
      global.fetch = mockFetch;

      await collect(streamChat("key", "model", "You are a coding assistant", []));

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.system).toBe("You are a coding assistant");
    });

    it("enables extended thinking when flag is set", async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse(sseEvent({ type: "message_stop" }))
      );
      global.fetch = mockFetch;

      await collect(streamChat("key", "model", "", [], undefined, true));

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.thinking).toEqual({
        type: "enabled",
        budget_tokens: 4096,
      });
    });

    it("yields delta events for text content", async () => {
      const body =
        sseEvent({
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        }) +
        sseEvent({
          type: "content_block_delta",
          delta: { type: "text_delta", text: " world" },
        }) +
        sseEvent({ type: "message_stop" });

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(body));

      const events = await collect(streamChat("key", "model", "", []));

      const deltas = events.filter(
        (e): e is Extract<StreamEvent, { type: "delta" }> => e.type === "delta"
      );
      expect(deltas).toHaveLength(2);
      expect(deltas[0].content).toBe("Hello");
      expect(deltas[1].content).toBe(" world");
    });

    it("handles tool use events", async () => {
      const body =
        sseEvent({
          type: "content_block_start",
          index: 0,
          content_block: { type: "tool_use", id: "call_456", name: "read_file" },
        }) +
        sseEvent({
          type: "content_block_delta",
          index: 0,
          delta: { type: "input_json_delta", partial_json: '{"path":' },
        }) +
        sseEvent({
          type: "content_block_delta",
          index: 0,
          delta: { type: "input_json_delta", partial_json: '"test.txt"}' },
        }) +
        sseEvent({ type: "content_block_stop", index: 0 }) +
        sseEvent({ type: "message_stop" });

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(body));

      const events = await collect(streamChat("key", "model", "", []));

      const toolCalls = events.filter(
        (e): e is Extract<StreamEvent, { type: "tool_call" }> => e.type === "tool_call"
      );
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].id).toBe("call_456");
      expect(toolCalls[0].name).toBe("read_file");
      expect(toolCalls[0].arguments).toBe('{"path":"test.txt"}');
    });

    it("yields usage from message_delta", async () => {
      const body =
        sseEvent({
          type: "message_delta",
          usage: { input_tokens: 20, output_tokens: 15 },
        }) +
        sseEvent({ type: "message_stop" });

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(body));

      const events = await collect(streamChat("key", "model", "", []));

      const doneEvents = events.filter(
        (e): e is Extract<StreamEvent, { type: "done" }> => e.type === "done"
      );
      const doneWithUsage = doneEvents.find((e) => e.usage);
      expect(doneWithUsage?.usage).toEqual({
        prompt_tokens: 20,
        completion_tokens: 15,
      });
    });

    it("yields error for network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection failed"));

      const events = await collect(streamChat("key", "model", "", []));

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("error");
      expect((events[0] as { message: string }).message).toContain("Network error");
    });

    it("yields error for non-OK response", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        createMockResponse("Invalid API key", { ok: false, status: 401 })
      );

      const events = await collect(streamChat("bad-key", "model", "", []));

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("error");
      expect((events[0] as { message: string }).message).toContain("Anthropic API error 401");
    });

    it("handles AbortSignal gracefully", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const controller = new AbortController();
      const events = await collect(
        streamChat("key", "model", "", [], undefined, false, controller.signal)
      );

      expect(events).toHaveLength(0);
    });

    it("handles thinking delta events", async () => {
      const body =
        sseEvent({
          type: "content_block_delta",
          delta: { type: "thinking_delta", thinking: "Let me think..." },
        }) +
        sseEvent({ type: "message_stop" });

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(body));

      const events = await collect(streamChat("key", "model", "", []));

      const deltas = events.filter(
        (e): e is Extract<StreamEvent, { type: "delta" }> => e.type === "delta"
      );
      expect(deltas).toHaveLength(1);
      expect(deltas[0].content).toContain("thinking");
      expect(deltas[0].content).toContain("Let me think...");
    });

    it("handles error event in stream", async () => {
      const body = sseEvent({ type: "error" });

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(body));

      const events = await collect(streamChat("key", "model", "", []));

      const errors = events.filter((e) => e.type === "error");
      expect(errors).toHaveLength(1);
    });
  });
});
