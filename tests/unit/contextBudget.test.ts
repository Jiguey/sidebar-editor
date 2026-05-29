import { describe, expect, it } from "vitest";
import type { Message as ProviderMessage } from "../../src/lib/providers/openaiCompat";
import {
  contextBudgetLimit,
  effectiveReserveTokens,
  estimateProviderMessagesTokens,
  isAgentContextBudgetExceeded,
  resolveModelContextWindow,
} from "../../src/lib/contextBudget";

describe("contextBudget", () => {
  it("uses smaller reserve for tiny Ollama contexts", () => {
    expect(effectiveReserveTokens(2048)).toBeLessThanOrEqual(512);
    expect(contextBudgetLimit(2048)).toBeGreaterThan(1500);
  });

  it("resolveModelContextWindow respects per-model Ollama num_ctx", () => {
    expect(
      resolveModelContextWindow({
        chatBackend: "ollama",
        selectedModel: "tinyllama",
        ollamaModels: [{ id: "tinyllama", name: "Tiny", provider: "ollama", contextWindow: 4096 }],
        llamacppModels: [],
        anthropicContextBudget: null,
      })
    ).toBe(4096);
  });

  it("stops when estimated tokens exceed window minus reserve", () => {
    const window = 2048;
    const messages: ProviderMessage[] = [
      { role: "system", content: "token ".repeat(5000) },
      { role: "user", content: "hi" },
    ];
    expect(estimateProviderMessagesTokens(messages)).toBeGreaterThan(contextBudgetLimit(window));
    expect(isAgentContextBudgetExceeded(messages, window)).toBe(true);
  });

  it("allows messages under budget", () => {
    const messages: ProviderMessage[] = [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello" },
    ];
    expect(isAgentContextBudgetExceeded(messages, 8192)).toBe(false);
  });
});
