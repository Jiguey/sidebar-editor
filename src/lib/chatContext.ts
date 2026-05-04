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

/** Estimate context used by chat text + optional unsent draft (per-message overhead is small). */
export function estimateChatContextTokens(
  messages: { role: string; content: string }[],
  draft = ""
): number {
  let n = 0;
  for (const m of messages) {
    n += 4;
    n += countTokens(m.content);
  }
  if (draft) n += 4 + countTokens(draft);
  return n;
}
