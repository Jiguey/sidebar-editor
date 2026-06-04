/** Configurable caps for the agent loop (one user message → multi-step tool chain). */

import { READ_ONLY_TOOLS } from "./tools/toolDefinitions";

export type AgentLimits = {
  /** LLM ↔ tool round trips per user message. 0 = unlimited. */
  maxAgentSteps: number;
  /** Total tool executions across all steps for one user message. 0 = unlimited. */
  maxToolCallsPerRun: number;
  /** Tool calls allowed from a single model response. 0 = unlimited. */
  maxToolsPerTurn: number;
  /** Run independent read-only tools concurrently within a single model turn. */
  parallelExecution: boolean;
  /** Maximum number of tools to run concurrently when parallelExecution is enabled. */
  maxConcurrentTools: number;
};

export const DEFAULT_AGENT_LIMITS: AgentLimits = {
  maxAgentSteps: 0,
  maxToolCallsPerRun: 0,
  maxToolsPerTurn: 0,
  parallelExecution: false,
  maxConcurrentTools: 4,
};

export const AGENT_LIMIT_BOUNDS = {
  maxAgentSteps: { min: 0, max: 200 },
  maxToolCallsPerRun: { min: 0, max: 500 },
  maxToolsPerTurn: { min: 0, max: 50 },
  maxConcurrentTools: { min: 1, max: 16 },
} as const;

/**
 * Tools safe to run concurrently — they read but never write workspace state.
 * Write tools always run sequentially to prevent race conditions.
 * Kept in sync with `READ_ONLY_TOOLS` in `toolDefinitions.ts`.
 */
export const READ_ONLY_TOOL_NAMES = new Set<string>(READ_ONLY_TOOLS);

export function isReadOnlyTool(name: string): boolean {
  return READ_ONLY_TOOL_NAMES.has(name);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function isUnlimitedCap(value: number): boolean {
  return value <= 0;
}

export function clampAgentLimits(raw: Partial<AgentLimits> | undefined): AgentLimits {
  const base = raw ?? {};
  return {
    maxAgentSteps: clampInt(
      base.maxAgentSteps,
      AGENT_LIMIT_BOUNDS.maxAgentSteps.min,
      AGENT_LIMIT_BOUNDS.maxAgentSteps.max,
      DEFAULT_AGENT_LIMITS.maxAgentSteps
    ),
    maxToolCallsPerRun: clampInt(
      base.maxToolCallsPerRun,
      AGENT_LIMIT_BOUNDS.maxToolCallsPerRun.min,
      AGENT_LIMIT_BOUNDS.maxToolCallsPerRun.max,
      DEFAULT_AGENT_LIMITS.maxToolCallsPerRun
    ),
    maxToolsPerTurn: clampInt(
      base.maxToolsPerTurn,
      AGENT_LIMIT_BOUNDS.maxToolsPerTurn.min,
      AGENT_LIMIT_BOUNDS.maxToolsPerTurn.max,
      DEFAULT_AGENT_LIMITS.maxToolsPerTurn
    ),
    parallelExecution: typeof base.parallelExecution === "boolean"
      ? base.parallelExecution
      : DEFAULT_AGENT_LIMITS.parallelExecution,
    maxConcurrentTools: clampInt(
      base.maxConcurrentTools,
      AGENT_LIMIT_BOUNDS.maxConcurrentTools.min,
      AGENT_LIMIT_BOUNDS.maxConcurrentTools.max,
      DEFAULT_AGENT_LIMITS.maxConcurrentTools
    ),
  };
}

/** Migrate saved limits that matched the old fixed defaults to unlimited. */
export function normalizeAgentLimits(raw: Partial<AgentLimits> | undefined): AgentLimits {
  const c = clampAgentLimits(raw);
  if (c.maxAgentSteps === 12 && c.maxToolCallsPerRun === 48 && c.maxToolsPerTurn === 0) {
    return { ...DEFAULT_AGENT_LIMITS };
  }
  return c;
}

export function shouldContinueAgentStep(step: number, limits: AgentLimits): boolean {
  if (isUnlimitedCap(limits.maxAgentSteps)) return true;
  return step < limits.maxAgentSteps;
}

export function isToolRunCapReached(executed: number, limits: AgentLimits): boolean {
  if (isUnlimitedCap(limits.maxToolCallsPerRun)) return false;
  return executed >= limits.maxToolCallsPerRun;
}

export function perTurnToolCap(limits: AgentLimits, toolCallCount: number): number {
  if (isUnlimitedCap(limits.maxToolsPerTurn)) return toolCallCount;
  return limits.maxToolsPerTurn;
}
