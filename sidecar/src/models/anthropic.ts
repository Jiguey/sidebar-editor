import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageStreamParams,
  MessageStreamEvent,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.js";
import { waitForToolDecision } from "../approvalGate.js";
import type { ModelProvider } from "./router.js";
import type { HarnessConfig, ChatMessage, HarnessEvent, ToolDefinition } from "../types.js";
import { toolNeedsUserApproval } from "../toolPolicy.js";

/** Adaptive extended thinking is supported on Claude 4.x models; older IDs may 400 if enabled. */
function modelLikelySupportsAdaptiveThinking(model: string): boolean {
  const m = model.toLowerCase();
  if (
    m.includes("claude-sonnet-4") ||
    m.includes("claude-opus-4") ||
    m.includes("claude-haiku-4")
  ) {
    return true;
  }
  if (m.includes("sonnet-4") || m.includes("opus-4") || m.includes("haiku-4")) {
    return true;
  }
  return /claude-(sonnet|opus|haiku)-4-\d{8}/i.test(model);
}

function buildStreamParams(
  config: HarnessConfig,
  anthropicMessages: MessageParam[],
  anthropicTools: Tool[],
  systemPrompt: string
): MessageStreamParams {
  const maxTokens =
    config.anthropicExtendedThinking && modelLikelySupportsAdaptiveThinking(config.model)
      ? 32000
      : 4096;

  const base: MessageStreamParams = {
    model: config.model,
    max_tokens: maxTokens,
    messages: anthropicMessages,
    tools: anthropicTools,
    system: systemPrompt,
  };

  if (
    config.anthropicExtendedThinking &&
    modelLikelySupportsAdaptiveThinking(config.model)
  ) {
    return {
      ...base,
      thinking: { type: "adaptive" },
    } as unknown as MessageStreamParams;
  }

  return base;
}

export class AnthropicProvider implements ModelProvider {
  async *chat(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    config: HarnessConfig,
    signal?: AbortSignal
  ): AsyncGenerator<HarnessEvent> {
    if (!config.apiKey) {
      yield { type: "error", message: "Anthropic API key not configured" };
      return;
    }

    const client = new Anthropic({ apiKey: config.apiKey });

    const anthropicTools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
    }));

    const anthropicMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const jsonBuf = new Map<number, string>();
    const toolMeta = new Map<number, { id: string; name: string }>();
    const thinkingBuf = new Map<number, string>();

    const systemPrompt = `You are a helpful coding assistant. You have access to tools to read and write files, list directories, and run commands. Use these tools to help the user with their coding tasks.

Current workspace: ${config.workspacePath}`;

    try {
      const stream = client.messages.stream(
        buildStreamParams(config, anthropicMessages, anthropicTools, systemPrompt)
      );

      const onAbort = () => {
        try {
          stream.abort();
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

      let currentText = "";
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        for await (const ev of stream as AsyncIterable<MessageStreamEvent>) {
          switch (ev.type) {
          case "message_start": {
            const u = ev.message.usage;
            if (u?.input_tokens != null) inputTokens = u.input_tokens;
            break;
          }
          case "content_block_start": {
            const block = ev.content_block as { type: string };
            if (block.type === "thinking") {
              thinkingBuf.set(ev.index, "");
            }
            if (block.type === "tool_use") {
              const tu = ev.content_block as { type: "tool_use"; id: string; name: string };
              toolMeta.set(ev.index, { id: tu.id, name: tu.name });
              jsonBuf.set(ev.index, "");
            }
            break;
          }
          case "content_block_delta": {
            const delta = ev.delta as {
              type: string;
              thinking?: string;
              text?: string;
              partial_json?: string;
            };
            if (delta.type === "thinking_delta" && delta.thinking != null) {
              const prev = thinkingBuf.get(ev.index) ?? "";
              const next = prev + delta.thinking;
              thinkingBuf.set(ev.index, next);
              yield { type: "thinking", content: next, done: false };
            } else if (delta.type === "text_delta" && delta.text != null) {
              currentText += delta.text;
              yield {
                type: "message",
                role: "assistant",
                content: currentText,
                done: false,
              };
            } else if (delta.type === "input_json_delta" && delta.partial_json != null) {
              const prev = jsonBuf.get(ev.index) ?? "";
              jsonBuf.set(ev.index, prev + delta.partial_json);
            }
            break;
          }
          case "content_block_stop": {
            if (thinkingBuf.has(ev.index)) {
              const t = thinkingBuf.get(ev.index) ?? "";
              thinkingBuf.delete(ev.index);
              yield { type: "thinking", content: t, done: true };
              break;
            }

            const meta = toolMeta.get(ev.index);
            if (!meta) break;

            toolMeta.delete(ev.index);
            let input: unknown = {};
            const raw = jsonBuf.get(ev.index) ?? "{}";
            jsonBuf.delete(ev.index);
            try {
              input = JSON.parse(raw || "{}");
            } catch {
              input = { _parseError: true, raw };
            }

            let approved = true;
            if (toolNeedsUserApproval(meta.name, config)) {
              const decision = waitForToolDecision(meta.id);
              yield {
                type: "tool_approval_needed",
                id: meta.id,
                tool: meta.name,
                input,
              };
              approved = await decision;
            }

            if (!approved) {
              yield {
                type: "tool_end",
                id: meta.id,
                tool: meta.name,
                output: { denied: true, reason: "user_denied" },
              };
              yield {
                type: "message",
                role: "assistant",
                content: `Tool **${meta.name}** was not approved.`,
                done: true,
              };
            } else {
              yield { type: "tool_start", id: meta.id, tool: meta.name, input };
              yield {
                type: "tool_end",
                id: meta.id,
                tool: meta.name,
                output: {
                  note: "Tool execution is not wired to the desktop shell yet.",
                },
              };
            }
            break;
          }
          case "message_delta": {
            if (ev.usage) outputTokens = ev.usage.output_tokens;
            break;
          }
          case "message_stop": {
            if (currentText.trim()) {
              yield {
                type: "message",
                role: "assistant",
                content: currentText,
                done: true,
              };
            }
            yield { type: "usage", inputTokens, outputTokens };
            break;
          }
          default:
            break;
          }
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
