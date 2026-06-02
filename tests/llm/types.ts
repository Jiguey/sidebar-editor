import type { Message as ProviderMessage } from "../../src/lib/providers/openaiCompat";
import type { Tool } from "../../src/lib/providers/openaiCompat";

export type EvalMode = "chat" | "plan" | "agent";

export interface EvalMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMTestCase {
  id: string;
  suite: string;
  mode: EvalMode;
  description: string;
  messages: EvalMessage[];
  systemPrompt?: string;
  tools?: string[];
  expectedBehavior: string;
  tags: string[];
  repeat?: number;
  /** Run before this test (e.g. seed plan files). */
  setup?: (ctx: EvalRunContext) => Promise<void>;
  /** Expected tool names for agent/plan tests (objective pass/fail signal). */
  expectedTools?: string[];
}

export interface LLMSuite {
  id: string;
  title: string;
  tests: LLMTestCase[];
}

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, unknown>;
  result: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}

export interface LLMTestResult {
  testId: string;
  suite: string;
  mode: string;
  description: string;
  runIndex: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  response: string;
  tokenCount?: number;
  firstTokenMs?: number;
  toolCalls?: ToolCallRecord[];
  agentSteps?: number;
  status: "pass" | "fail" | "timeout" | "error";
  errorMessage?: string;
  humanScore?: 1 | 2 | 3 | 4 | 5;
  humanNotes?: string;
}

export interface EvalRunContext {
  workspacePath: string;
  fixturesDir: string;
  resultsDir: string;
}

export interface RunTestOptions {
  test: LLMTestCase;
  runIndex: number;
  model: string;
  ollamaBaseUrl: string;
  workspacePath: string;
  timeouts: {
    firstToken: number;
    fullResponse: number;
    toolCall: number;
    agentRun: number;
  };
  maxAgentSteps: number;
  tools?: Tool[];
  toolNames?: string[];
}

export type ProviderMessageHistory = ProviderMessage[];
