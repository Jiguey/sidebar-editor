import type { HarnessEvent } from "./types.js";

/** Shape of each item from `Ollama` SDK `chat({ stream: true })` iterator. */
export type OllamaChatStreamChunk = {
  message: {
    content?: string;
    thinking?: string;
  };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
};

/**
 * Maps Ollama streaming chat chunks to the harness events the UI consumes
 * (`thinking`, cumulative `message`, final `usage`).
 */
export async function* ollamaChatChunksToHarnessEvents(
  stream: AsyncIterable<OllamaChatStreamChunk>
): AsyncGenerator<HarnessEvent> {
  let currentContent = "";
  let currentThinking = "";

  for await (const chunk of stream) {
    const msg = chunk.message;
    const thinkPiece = typeof msg.thinking === "string" ? msg.thinking : "";
    if (thinkPiece.length > 0) {
      currentThinking += thinkPiece;
      yield {
        type: "thinking",
        content: currentThinking,
        done: false,
      };
    }

    const textPiece = typeof msg.content === "string" ? msg.content : "";
    currentContent += textPiece;

    yield {
      type: "message",
      role: "assistant",
      content: currentContent,
      done: chunk.done,
    };

    if (chunk.done) {
      if (currentThinking.length > 0) {
        yield {
          type: "thinking",
          content: currentThinking,
          done: true,
        };
      }
      yield {
        type: "usage",
        inputTokens: chunk.prompt_eval_count ?? 0,
        outputTokens: chunk.eval_count ?? 0,
      };
    }
  }
}
