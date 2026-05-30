import { describe, expect, it } from "vitest";
import {
  chatHasMessagesForCompaction,
  compactionThresholdFromPercent,
  compactionThresholdPercent,
  normalizeAgentCompaction,
} from "../../src/lib/agentCompaction";

describe("agentCompaction", () => {
  it("normalizes threshold and keep recent bounds", () => {
    const s = normalizeAgentCompaction({
      autoCompact: true,
      compactThreshold: 0.99,
      compactKeepRecentTurns: 100,
    });
    expect(s.autoCompact).toBe(true);
    expect(s.compactThreshold).toBe(0.95);
    expect(s.compactKeepRecentTurns).toBe(20);
  });

  it("converts percent UI to stored fraction", () => {
    expect(compactionThresholdFromPercent(85)).toBe(0.85);
    expect(compactionThresholdPercent(0.85)).toBe(85);
  });

  it("allows manual compact when chat has any messages", () => {
    expect(chatHasMessagesForCompaction(0)).toBe(false);
    expect(chatHasMessagesForCompaction(1)).toBe(true);
  });
});
