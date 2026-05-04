import { Ollama } from "ollama";
import type { ModelProvider } from "./router.js";
import type { HarnessConfig, ChatMessage, HarnessEvent, ToolDefinition } from "../types.js";
import { ollamaChatChunksToHarnessEvents } from "../ollamaStreamToHarnessEvents.js";

export class OllamaProvider implements ModelProvider {
  async *chat(
    messages: ChatMessage[],
    _tools: ToolDefinition[],
    config: HarnessConfig,
    signal?: AbortSignal
  ): AsyncGenerator<HarnessEvent> {
    const endpoint = config.ollamaEndpoint ?? "http://localhost:11434";
    const client = new Ollama({ host: endpoint });

    const ollamaMessages: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content: `You are a helpful coding assistant. Help the user with their coding tasks.

Current workspace: ${config.workspacePath}`,
      },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const numCtx =
      typeof config.ollamaNumCtx === "number" && config.ollamaNumCtx > 0
        ? Math.floor(config.ollamaNumCtx)
        : undefined;

    try {
      let stream;
      const baseChat = {
        model: config.model,
        messages: ollamaMessages,
        stream: true as const,
        ...(numCtx ? { options: { num_ctx: numCtx } } : {}),
      };
      try {
        stream = await client.chat({
          ...baseChat,
          /** Enables reasoning models to stream `message.thinking` separately from `content` (Ollama API). */
          think: true,
        });
      } catch {
        stream = await client.chat(baseChat);
      }

      const onAbort = () => {
        try {
          (stream as { abort?: () => void }).abort?.();
        } catch {
          /* ignore */
        }
      };
      if (signal) {
        if (signal.aborted) {
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        for await (const ev of ollamaChatChunksToHarnessEvents(stream)) {
          yield ev;
        }
      } finally {
        signal?.removeEventListener("abort", onAbort);
      }
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      yield {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
