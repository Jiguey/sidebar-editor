import type { ModelProvider } from "./router.js";
import type { HarnessConfig, ChatMessage, HarnessEvent, ToolDefinition } from "../types.js";

/**
 * llama.cpp HTTP server (OpenAI-compatible `/v1/chat/completions` with SSE).
 * Start with e.g. `llama-server -m model.gguf --port 8080`.
 */
export class LlamaCppProvider implements ModelProvider {
  async *chat(
    messages: ChatMessage[],
    _tools: ToolDefinition[],
    config: HarnessConfig,
    signal?: AbortSignal
  ): AsyncGenerator<HarnessEvent> {
    const base = (config.llamacppEndpoint ?? "http://127.0.0.1:8080").replace(/\/$/, "");
    const url = `${base}/v1/chat/completions`;

    const openaiMessages: Array<{ role: string; content: string }> = [
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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    const key = config.llamacppApiKey?.trim();
    if (key) {
      headers.Authorization = `Bearer ${key}`;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          model: config.model,
          messages: openaiMessages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        yield {
          type: "error",
          message: `llama.cpp server ${res.status}: ${errText.slice(0, 500)}`,
        };
        return;
      }

      if (!res.body) {
        yield { type: "error", message: "llama.cpp server returned no response body" };
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        if (signal?.aborted) {
          try {
            await reader.cancel();
          } catch {
            /* ignore */
          }
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          for (const rawLine of block.split("\n")) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              yield { type: "message", role: "assistant", content: full, done: true };
              return;
            }
            try {
              const j = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const piece = j.choices?.[0]?.delta?.content ?? "";
              if (piece) {
                full += piece;
                yield { type: "message", role: "assistant", content: full, done: false };
              }
            } catch {
              /* ignore non-JSON keep-alive lines */
            }
          }
        }
      }

      if (buffer.trim()) {
        for (const rawLine of buffer.split("\n")) {
          const line = rawLine.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            yield { type: "message", role: "assistant", content: full, done: true };
            return;
          }
          try {
            const j = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const piece = j.choices?.[0]?.delta?.content ?? "";
            if (piece) full += piece;
          } catch {
            /* ignore */
          }
        }
      }

      yield { type: "message", role: "assistant", content: full, done: true };
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
