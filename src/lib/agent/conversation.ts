import type { Message as ProviderMessage, ToolCall as OpenAIToolCall } from "../providers/openaiCompat";
import type { Message as ChatMessage, StoredToolCall } from "../stores/chat";

export function buildProviderMessages(
  systemPrompt: string,
  history: ChatMessage[]
): ProviderMessage[] {
  const out: ProviderMessage[] = [{ role: "system", content: systemPrompt }];

  for (const msg of history) {
    if (msg.role === "user") {
      out.push({ role: "user", content: msg.content });
      continue;
    }

    if (msg.role === "assistant") {
      if (msg.rawToolCalls && msg.rawToolCalls.length > 0) {
        const tool_calls: OpenAIToolCall[] = msg.rawToolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        }));
        out.push({
          role: "assistant",
          content: msg.content || null,
          tool_calls,
        });
      } else {
        out.push({ role: "assistant", content: msg.content });
      }
      continue;
    }

    if (msg.role === "tool") {
      out.push({
        role: "tool",
        content: msg.content,
        tool_call_id: msg.toolCallId ?? "",
      });
    }
  }

  return out;
}

export function appendAssistantToolCalls(
  messages: ProviderMessage[],
  content: string,
  toolCalls: StoredToolCall[]
): ProviderMessage[] {
  const tool_calls: OpenAIToolCall[] = toolCalls.map((tc) => ({
    id: tc.id,
    type: "function",
    function: { name: tc.name, arguments: tc.arguments },
  }));
  return [
    ...messages,
    {
      role: "assistant",
      content: content || null,
      tool_calls,
    },
  ];
}

export function appendToolResults(
  messages: ProviderMessage[],
  results: Array<{ id: string; content: string }>
): ProviderMessage[] {
  return [
    ...messages,
    ...results.map((r) => ({
      role: "tool" as const,
      content: r.content,
      tool_call_id: r.id,
    })),
  ];
}
