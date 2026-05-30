import {
  streamChat as streamOpenAI,
  type Message,
  type StreamEvent,
  type Tool,
} from "./openaiCompat";

/** DeepSeek OpenAI-compatible API base (see https://api-docs.deepseek.com). */
export const DEEPSEEK_API_BASE = "https://api.deepseek.com";

export const DEEPSEEK_MODELS = [
  { id: "deepseek-chat", name: "DeepSeek Chat", contextWindow: 65_536 },
  { id: "deepseek-reasoner", name: "DeepSeek Reasoner", contextWindow: 65_536 },
] as const;

export async function* streamChat(
  apiKey: string,
  model: string,
  messages: Message[],
  tools?: Tool[],
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  yield* streamOpenAI(
    DEEPSEEK_API_BASE,
    model,
    messages,
    tools,
    signal,
    undefined,
    apiKey
  );
}
