import type { Tool } from "../providers/openaiCompat";
import type { Message as ProviderMessage, StreamEvent } from "../providers/openaiCompat";
import { streamChat as streamChatOpenAI } from "../providers/openaiCompat";
import { streamChat as streamChatAnthropic } from "../providers/anthropic";
import type { StoredToolCall } from "../stores/chat";

export type StreamTurnResult = {
  content: string;
  toolCalls: StoredToolCall[];
  usage?: { prompt_tokens: number; completion_tokens: number };
};

export async function streamOneTurn(options: {
  backend: "anthropic" | "ollama" | "llamacpp";
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  messages: ProviderMessage[];
  tools?: Tool[];
  extendedThinking?: boolean;
  signal?: AbortSignal;
  onDelta?: (content: string) => void;
}): Promise<StreamTurnResult> {
  let fullContent = "";
  const toolCalls: StoredToolCall[] = [];
  let usage: StreamTurnResult["usage"];

  const processStream = async (stream: AsyncGenerator<StreamEvent>) => {
    for await (const event of stream) {
      if (event.type === "delta") {
        fullContent += event.content;
        options.onDelta?.(fullContent);
      } else if (event.type === "tool_call") {
        toolCalls.push({
          id: event.id,
          name: event.name,
          arguments: event.arguments,
        });
      } else if (event.type === "done" && event.usage) {
        usage = {
          prompt_tokens: event.usage.prompt_tokens,
          completion_tokens: event.usage.completion_tokens,
        };
      } else if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  };

  if (options.backend === "anthropic") {
    const anthropicMessages = options.messages.filter((m) => m.role !== "system");
    const stream = streamChatAnthropic(
      options.apiKey,
      options.model,
      options.systemPrompt,
      anthropicMessages,
      options.tools,
      options.extendedThinking,
      options.signal
    );
    await processStream(stream);
  } else {
    const stream = streamChatOpenAI(
      options.baseUrl,
      options.model,
      options.messages,
      options.tools,
      options.signal
    );
    await processStream(stream);
  }

  return { content: fullContent, toolCalls, usage };
}
