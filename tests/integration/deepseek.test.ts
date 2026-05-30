import { describe, it, expect } from "vitest";
import { deepseekApiKeyFromProcessEnv } from "../../src/lib/envApiKeys";
import { fetchDeepseekModelCatalog } from "../../src/lib/cloudModelCatalog";
import { streamChat } from "../../src/lib/providers/deepseek";

const RUN = process.env.RUN_DEEPSEEK_TESTS === "1";
const apiKey = deepseekApiKeyFromProcessEnv();
const describeDeepseek = RUN && apiKey.length >= 20 ? describe : describe.skip;

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

describeDeepseek("DeepSeek (integration)", () => {
  it("lists models for the API key", async () => {
    const models = await fetchDeepseekModelCatalog(apiKey);
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.provider === "deepseek" && m.id.length > 0)).toBe(true);
  });

  it("streams a short chat completion", async () => {
    const models = await fetchDeepseekModelCatalog(apiKey);
    const modelId = models[0]!.id;
    const events = await collect(
      streamChat(apiKey, modelId, [{ role: "user", content: "Reply with exactly: OK" }])
    );
    const errors = events.filter((e) => e.type === "error");
    if (errors.length > 0) {
      const msg = errors.map((e) => (e.type === "error" ? e.message : "")).join("; ");
      if (msg.includes("402") || /insufficient balance/i.test(msg)) {
        console.warn("Skipping stream assertions: DeepSeek account has no balance.");
        return;
      }
      expect.fail(msg);
    }
    const deltas = events.filter((e) => e.type === "delta");
    expect(deltas.length).toBeGreaterThan(0);
    const text = deltas.map((e) => (e.type === "delta" ? e.content : "")).join("");
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
