import type { ChatBackend } from "./stores/settings";

export type ChatFooterProfile = {
  /** Show tok/s · output tok · duration for the last reply. */
  showStreamMetrics: boolean;
  showContextBar: boolean;
  /** Allow changing context window / budget from the footer menu. */
  contextBudgetEditable: boolean;
  /** Suffix on context label, e.g. "server" for llama.cpp. */
  contextHint?: string;
  /** Show rolling monthly input/output token totals (API providers). */
  showMonthlyUsage: boolean;
  usageProviderId: string;
};

const FOOTER_PROFILES: Record<ChatBackend, ChatFooterProfile> = {
  ollama: {
    showStreamMetrics: true,
    showContextBar: true,
    contextBudgetEditable: true,
    showMonthlyUsage: false,
    usageProviderId: "ollama",
  },
  llamacpp: {
    showStreamMetrics: true,
    showContextBar: true,
    contextBudgetEditable: false,
    contextHint: "server",
    showMonthlyUsage: false,
    usageProviderId: "llamacpp",
  },
  anthropic: {
    showStreamMetrics: true,
    showContextBar: true,
    contextBudgetEditable: false,
    showMonthlyUsage: true,
    usageProviderId: "anthropic",
  },
  deepseek: {
    showStreamMetrics: true,
    showContextBar: true,
    contextBudgetEditable: false,
    showMonthlyUsage: true,
    usageProviderId: "deepseek",
  },
};

export function chatFooterProfile(backend: ChatBackend): ChatFooterProfile {
  return FOOTER_PROFILES[backend];
}

export function formatMonthlyUsageLabel(inputTokens: number, outputTokens: number): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(Math.round(n));
  };
  const month = new Date().toLocaleString(undefined, { month: "short" });
  return `${month}: ${fmt(inputTokens)} in · ${fmt(outputTokens)} out`;
}

export function cloudContextBudgetTitle(contextMax: number): string {
  return (
    `Estimated tokens in this chat vs the model limit (~${contextMax.toLocaleString()}). ` +
    `Providers do not expose remaining account balance in the API — check your dashboard for billing.`
  );
}

export function contextBudgetTitle(profile: ChatFooterProfile, backend: ChatBackend): string {
  if (profile.contextBudgetEditable) {
    return "Change context window for this model";
  }
  if (backend === "llamacpp") {
    return "Context size is fixed in llama.cpp server config — change it there and restart";
  }
  if (backend === "anthropic" || backend === "deepseek") {
    return "Estimated chat size vs model context limit";
  }
  return "Estimated context for this chat";
}
