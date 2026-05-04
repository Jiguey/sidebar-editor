import type { HarnessConfig, ChatMessage, HarnessEvent, ToolDefinition } from "../types.js";
import { AnthropicProvider } from "./anthropic.js";
import { OllamaProvider } from "./ollama.js";
import { LlamaCppProvider } from "./llamaCpp.js";

export interface ModelProvider {
  chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: HarnessConfig,
    signal?: AbortSignal
  ): AsyncGenerator<HarnessEvent>;
}

export function getProvider(config: HarnessConfig): ModelProvider {
  switch (config.provider) {
    case "anthropic":
      return new AnthropicProvider();
    case "ollama":
      return new OllamaProvider();
    case "llamacpp":
      return new LlamaCppProvider();
    case "openai":
      throw new Error("OpenAI provider not yet implemented");
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
