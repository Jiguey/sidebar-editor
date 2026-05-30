import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  streamChat,
  DEEPSEEK_API_BASE,
  DEEPSEEK_MODELS,
} from "../../../src/lib/providers/deepseek";
import type { StreamEvent } from "../../../src/lib/providers/openaiCompat";

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

function createMockResponse(body: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    body: stream,
    text: async () => body,
  } as Response;
}

describe("deepseek provider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("exports models and API base", () => {
    expect(DEEPSEEK_API_BASE).toBe("https://api.deepseek.com");
    expect(DEEPSEEK_MODELS.map((m) => m.id)).toContain("deepseek-chat");
    expect(DEEPSEEK_MODELS.map((m) => m.id)).toContain("deepseek-reasoner");
  });

  it("sends Bearer auth to DeepSeek chat completions", async () => {
    const sse = 'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n';
    vi.mocked(global.fetch).mockResolvedValue(createMockResponse(sse));

    const events = await collect(
      streamChat("sk-test-key", "deepseek-chat", [{ role: "user", content: "Hello" }])
    );

    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${DEEPSEEK_API_BASE}/v1/chat/completions`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test-key");
    expect(events.some((e: StreamEvent) => e.type === "delta")).toBe(true);
  });
});
