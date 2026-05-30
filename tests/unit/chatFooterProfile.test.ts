import { describe, expect, it } from "vitest";
import {
  chatFooterProfile,
  formatMonthlyUsageLabel,
  contextBudgetTitle,
} from "../../src/lib/chatFooterProfile";

describe("chatFooterProfile", () => {
  it("ollama allows context budget edits", () => {
    expect(chatFooterProfile("ollama").contextBudgetEditable).toBe(true);
    expect(chatFooterProfile("ollama").showStreamMetrics).toBe(true);
  });

  it("llamacpp is read-only context", () => {
    const p = chatFooterProfile("llamacpp");
    expect(p.contextBudgetEditable).toBe(false);
    expect(p.contextHint).toBe("server");
  });

  it("anthropic and deepseek show monthly usage and last-reply metrics", () => {
    for (const backend of ["anthropic", "deepseek"] as const) {
      const p = chatFooterProfile(backend);
      expect(p.showMonthlyUsage).toBe(true);
      expect(p.showStreamMetrics).toBe(true);
      expect(p.contextBudgetEditable).toBe(false);
    }
  });
});

describe("formatMonthlyUsageLabel", () => {
  it("formats token totals with month prefix", () => {
    const label = formatMonthlyUsageLabel(12400, 3200);
    expect(label).toMatch(/^\w{3}: 12\.4k in · 3\.2k out$/);
  });
});

describe("contextBudgetTitle", () => {
  it("explains llamacpp server config", () => {
    const title = contextBudgetTitle(chatFooterProfile("llamacpp"), "llamacpp");
    expect(title).toContain("llama.cpp");
  });
});
