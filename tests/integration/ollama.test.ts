import { describe, it, expect } from "vitest";

const RUN = process.env.RUN_OLLAMA_TESTS === "1";
const host = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";

const describeOllama = RUN ? describe : describe.skip;

describeOllama("Ollama (integration)", () => {
  it("GET /api/version responds", async () => {
    const res = await fetch(`${host}/api/version`, {
      signal: AbortSignal.timeout(5000),
    });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { version?: string };
    expect(body.version).toBeDefined();
  });

  it("POST /api/chat streams or completes", async () => {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_TEST_MODEL ?? "llama3.2:1b",
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { message?: { content?: string } };
    expect(data.message?.content).toBeDefined();
  });

  it("POST /api/chat stream=true returns NDJSON with growing message.content", async () => {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_TEST_MODEL ?? "llama3.2:1b",
        messages: [{ role: "user", content: "Say hi in under 5 words." }],
        stream: true,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    expect(res.ok).toBe(true);
    const text = await res.text();
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines.length).toBeGreaterThan(0);

    type Chunk = { message?: { content?: string }; done?: boolean };
    const parsed = lines.map((l) => JSON.parse(l) as Chunk);
    const contents = parsed.map((c) => c.message?.content ?? "");
    const last = parsed[lines.length - 1];
    expect(last?.done).toBe(true);
    /** Cumulative content grows (same as Ollama SDK stream the sidecar consumes). */
    for (let i = 1; i < contents.length; i++) {
      expect(contents[i].length).toBeGreaterThanOrEqual(contents[i - 1].length);
    }
    const finalText = contents[contents.length - 1] ?? "";
    expect(finalText.trim().length).toBeGreaterThan(0);
  });
});
