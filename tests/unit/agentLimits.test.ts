import { describe, expect, it } from "vitest";
import {
  clampAgentLimits,
  DEFAULT_AGENT_LIMITS,
  AGENT_LIMIT_BOUNDS,
  isToolRunCapReached,
  isUnlimitedCap,
  normalizeAgentLimits,
  perTurnToolCap,
  shouldContinueAgentStep,
} from "../../src/lib/agentLimits";

describe("clampAgentLimits", () => {
  it("returns unlimited defaults for empty input", () => {
    expect(clampAgentLimits(undefined)).toEqual(DEFAULT_AGENT_LIMITS);
  });

  it("clamps values to bounds", () => {
    expect(
      clampAgentLimits({
        maxAgentSteps: 999,
        maxToolCallsPerRun: 999,
        maxToolsPerTurn: 100,
      })
    ).toEqual({
      maxAgentSteps: AGENT_LIMIT_BOUNDS.maxAgentSteps.max,
      maxToolCallsPerRun: AGENT_LIMIT_BOUNDS.maxToolCallsPerRun.max,
      maxToolsPerTurn: AGENT_LIMIT_BOUNDS.maxToolsPerTurn.max,
    });
  });

  it("allows zero for unlimited caps", () => {
    expect(clampAgentLimits({ maxAgentSteps: 0 }).maxAgentSteps).toBe(0);
    expect(clampAgentLimits({ maxToolCallsPerRun: 0 }).maxToolCallsPerRun).toBe(0);
    expect(clampAgentLimits({ maxToolsPerTurn: 0 }).maxToolsPerTurn).toBe(0);
  });
});

describe("normalizeAgentLimits", () => {
  it("migrates legacy 12/48 defaults to unlimited", () => {
    expect(
      normalizeAgentLimits({ maxAgentSteps: 12, maxToolCallsPerRun: 48, maxToolsPerTurn: 0 })
    ).toEqual(DEFAULT_AGENT_LIMITS);
  });

  it("keeps explicit non-default caps", () => {
    expect(normalizeAgentLimits({ maxAgentSteps: 5, maxToolCallsPerRun: 10, maxToolsPerTurn: 2 })).toEqual({
      maxAgentSteps: 5,
      maxToolCallsPerRun: 10,
      maxToolsPerTurn: 2,
    });
  });
});

describe("limit helpers", () => {
  const unlimited = DEFAULT_AGENT_LIMITS;
  const capped = { maxAgentSteps: 3, maxToolCallsPerRun: 2, maxToolsPerTurn: 1 };

  it("isUnlimitedCap", () => {
    expect(isUnlimitedCap(0)).toBe(true);
    expect(isUnlimitedCap(1)).toBe(false);
  });

  it("shouldContinueAgentStep", () => {
    expect(shouldContinueAgentStep(0, unlimited)).toBe(true);
    expect(shouldContinueAgentStep(999, unlimited)).toBe(true);
    expect(shouldContinueAgentStep(0, capped)).toBe(true);
    expect(shouldContinueAgentStep(2, capped)).toBe(true);
    expect(shouldContinueAgentStep(3, capped)).toBe(false);
  });

  it("isToolRunCapReached", () => {
    expect(isToolRunCapReached(0, unlimited)).toBe(false);
    expect(isToolRunCapReached(100, unlimited)).toBe(false);
    expect(isToolRunCapReached(1, capped)).toBe(false);
    expect(isToolRunCapReached(2, capped)).toBe(true);
  });

  it("perTurnToolCap", () => {
    expect(perTurnToolCap(unlimited, 5)).toBe(5);
    expect(perTurnToolCap(capped, 5)).toBe(1);
  });
});
