export type ToolPolicyMode = "allow_all" | "whitelist" | "ask_each";

export interface HarnessConfig {
  /** Which agent implementation the sidecar instantiates (see harnessFactory.ts). */
  harnessKind?: string;
  model: string;
  provider: "anthropic" | "openai" | "ollama" | "llamacpp";
  apiKey?: string;
  ollamaEndpoint?: string;
  /** Ollama `options.num_ctx` (must be ≤ model max context). */
  ollamaNumCtx?: number;
  /** Base URL for llama.cpp `llama-server` (OpenAI API, default port often 8080). */
  llamacppEndpoint?: string;
  /** Optional Bearer token if the server was started with `--api-key`. */
  llamacppApiKey?: string;
  workspacePath: string;
  /** Gating for tool calls (Anthropic tool-use path). */
  toolPolicy?: {
    mode: ToolPolicyMode;
    whitelist?: string[];
  };
  /** Request adaptive extended thinking from Anthropic when the model supports it. */
  anthropicExtendedThinking?: boolean;
}

export type HarnessEvent =
  | { type: "message"; role: "assistant"; content: string; done: boolean }
  /** Claude extended thinking (and similar); streamed incrementally like assistant text. */
  | { type: "thinking"; content: string; done: boolean }
  | { type: "tool_start"; id: string; tool: string; input: unknown }
  | { type: "tool_end"; id: string; tool: string; output: unknown }
  | { type: "tool_approval_needed"; id: string; tool: string; input: unknown }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "error"; message: string };

export interface RpcRequest {
  id: number;
  method: string;
  params: Record<string, unknown>;
}

export interface RpcResponse {
  id: number;
  result?: unknown;
  error?: string;
}

export interface RpcEvent {
  id: number;
  event: string;
  data: unknown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}
