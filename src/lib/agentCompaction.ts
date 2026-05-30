/** Context compaction settings (spec 21). Runtime wiring is not implemented yet. */

export type AgentCompactionSettings = {
  autoCompact: boolean;
  /** Fraction of context window (0.5–0.95) that triggers auto-compaction. */
  compactThreshold: number;
  /** Raw messages kept after compaction. */
  compactKeepRecentTurns: number;
};

export const DEFAULT_AGENT_COMPACTION: AgentCompactionSettings = {
  autoCompact: false,
  compactThreshold: 0.85,
  compactKeepRecentTurns: 6,
};

export const AGENT_COMPACTION_BOUNDS = {
  compactThreshold: { min: 0.5, max: 0.95 },
  compactKeepRecentTurns: { min: 2, max: 20 },
} as const;

function clampNum(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function normalizeAgentCompaction(
  raw: Partial<AgentCompactionSettings> | undefined
): AgentCompactionSettings {
  const base = raw ?? {};
  return {
    autoCompact: base.autoCompact === true,
    compactThreshold: clampNum(
      base.compactThreshold,
      AGENT_COMPACTION_BOUNDS.compactThreshold.min,
      AGENT_COMPACTION_BOUNDS.compactThreshold.max,
      DEFAULT_AGENT_COMPACTION.compactThreshold
    ),
    compactKeepRecentTurns: Math.round(
      clampNum(
        base.compactKeepRecentTurns,
        AGENT_COMPACTION_BOUNDS.compactKeepRecentTurns.min,
        AGENT_COMPACTION_BOUNDS.compactKeepRecentTurns.max,
        DEFAULT_AGENT_COMPACTION.compactKeepRecentTurns
      )
    ),
  };
}

/** UI percent input (50–95) from stored fraction. */
export function compactionThresholdPercent(threshold: number): number {
  return Math.round(threshold * 100);
}

export function compactionThresholdFromPercent(percent: number): number {
  const p = Math.round(
    clampNum(percent, 50, 95, compactionThresholdPercent(DEFAULT_AGENT_COMPACTION.compactThreshold))
  );
  return p / 100;
}

/** Shown when the user triggers manual compact before runtime is wired (spec 21). */
export const MANUAL_COMPACTION_UNAVAILABLE =
  "Conversation compaction is not available yet — start a new chat, use a smaller context in Settings, or ask for a shorter task.";

export const MANUAL_COMPACTION_BUTTON_TITLE =
  "Compact conversation — summarize older history to free context";

export function chatHasMessagesForCompaction(messageCount: number): boolean {
  return messageCount > 0;
}
