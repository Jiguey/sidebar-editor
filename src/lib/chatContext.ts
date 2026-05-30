import { encode } from "gpt-tokenizer";

/** Rough token count (cl100k); Claude differs slightly — good enough for the meter. */
export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

export type ChatContextMessageInput = {
  role: string;
  content: string;
  thinking?: string;
  rawToolCalls?: Array<{ name: string; arguments: string }>;
};

/** Estimate context used by chat text + optional unsent draft (per-message overhead is small). */
export function estimateChatContextTokens(
  messages: ChatContextMessageInput[],
  draft = ""
): number {
  let n = 0;
  for (const m of messages) {
    n += 4;
    n += countTokens(m.content);
    if (m.thinking?.trim()) {
      n += countTokens(m.thinking);
    }
    if (m.rawToolCalls?.length) {
      for (const tc of m.rawToolCalls) {
        n += countTokens(tc.name);
        n += countTokens(tc.arguments);
      }
    }
  }
  if (draft) n += 4 + countTokens(draft);
  return n;
}

/** In-flight assistant text not yet saved on the session (streaming buffer + live turn UI). */
export function estimateInflightContextTokens(parts: {
  streamingContent?: string;
  thinking?: string;
  planText?: string;
  response?: string;
}): number {
  const chunks: string[] = [];
  const stream = parts.streamingContent?.trim() ?? "";
  const response = parts.response?.trim() ?? "";
  if (stream) {
    chunks.push(stream);
  } else if (response) {
    chunks.push(response);
  }
  const thinking = parts.thinking?.trim() ?? "";
  if (thinking) chunks.push(thinking);
  const plan = parts.planText?.trim() ?? "";
  if (plan) chunks.push(plan);
  if (chunks.length === 0) return 0;
  return 4 + countTokens(chunks.join("\n\n"));
}
