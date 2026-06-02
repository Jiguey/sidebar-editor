import { describe, it, expect } from "vitest";
import { fetchLlamacppModelList, fetchLlamacppServerProps, parseLlamacppPropsJson } from "../../src/lib/llamaCppClient";
import { streamChat } from "../../src/lib/providers/openaiCompat";

const RUN = process.env.RUN_LLAMACPP_TESTS === "1";
const host = process.env.LLAMACPP_HOST ?? "http://127.0.0.1:8080";

const describeLlamacpp = RUN ? describe : describe.skip;

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

describeLlamacpp("llama.cpp (integration)", () => {
  it("GET /v1/models responds with at least one model", async () => {
    const res = await fetch(`${host}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { data?: { id: string }[] };
    expect(body.data).toBeDefined();
    expect(body.data!.length).toBeGreaterThan(0);
  });

  it("GET /props responds and contains n_ctx", async () => {
    const res = await fetch(`${host}/props`, {
      signal: AbortSignal.timeout(5000),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    const props = parseLlamacppPropsJson(body);
    expect(props.nCtx).not.toBeNull();
    expect(props.nCtx).toBeGreaterThan(0);
  });

  it("fetchLlamacppServerProps returns valid context window", async () => {
    const props = await fetchLlamacppServerProps(host);
    expect(props.nCtx).not.toBeNull();
    expect(props.nCtx).toBeGreaterThan(0);
    expect(props.totalSlots).not.toBeNull();
  });

  it("fetchLlamacppModelList returns models with correct context window", async () => {
    const models = await fetchLlamacppModelList(host);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].id).toBeTruthy();
    expect(models[0].contextWindow).toBeGreaterThan(0);
    // Should NOT default to fallback 8192 if server is running
    expect(models[0].contextWindow).not.toBe(8192);
  });

  it("POST /v1/chat/completions streams delta events (no Ollama extensions)", async () => {
    const models = await fetchLlamacppModelList(host);
    expect(models.length).toBeGreaterThan(0);
    const modelId = models[0].id;

    const events = await collect(
      streamChat(
        host,
        modelId,
        [{ role: "user", content: "Reply with exactly: OK" }],
        undefined,
        undefined,
        undefined,
        undefined,
        false // isOllama = false — no think/options extensions
      )
    );

    const deltas = events.filter((e) => e.type === "delta");
    const errors = events.filter((e) => e.type === "error");
    expect(errors).toHaveLength(0);
    expect(deltas.length).toBeGreaterThan(0);
  }, 120_000);

  it("does NOT send Ollama body extensions to llama.cpp", async () => {
    const originalFetch = global.fetch;
    let capturedBody: Record<string, unknown> | null = null;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body) {
        capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
      }
      return originalFetch(input, init);
    };

    const models = await fetchLlamacppModelList(host);
    const modelId = models[0]?.id ?? "model";

    const gen = streamChat(
      host,
      modelId,
      [{ role: "user", content: "hi" }],
      undefined,
      AbortSignal.timeout(5000),
      undefined,
      undefined,
      false // isOllama = false
    );
    for await (const _ of gen) break; // consume first event then abort

    global.fetch = originalFetch;

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.think).toBeUndefined();
    expect(capturedBody!.options).toBeUndefined();
  }, 30_000);

  it("streaming captures reasoning_content as thinking_delta when model thinks", async () => {
    const models = await fetchLlamacppModelList(host);
    expect(models.length).toBeGreaterThan(0);
    const modelId = models[0].id;

    const events = await collect(
      streamChat(
        host,
        modelId,
        [{ role: "user", content: "What is 2+2? Think step by step." }],
        undefined,
        undefined,
        undefined,
        undefined,
        false
      )
    );

    const errors = events.filter((e) => e.type === "error");
    expect(errors).toHaveLength(0);

    const thinking = events.filter((e) => e.type === "thinking_delta");
    const deltas = events.filter((e) => e.type === "delta");

    // Qwen3 on llama.cpp always emits reasoning_content first
    expect(thinking.length).toBeGreaterThan(0);
    expect(deltas.length).toBeGreaterThan(0);
  }, 180_000);
});
