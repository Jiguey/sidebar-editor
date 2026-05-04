export type ToolPolicyMode = "allow_all" | "whitelist" | "ask_each";

export interface ToolPolicyConfig {
  mode: ToolPolicyMode;
  /** Tool names allowed without prompt when mode is `whitelist` */
  whitelist: string[];
}

/** Whether the user must explicitly approve this tool call (Anthropic path only for now). */
export function toolNeedsUserApproval(
  toolName: string,
  policy: ToolPolicyConfig | undefined
): boolean {
  if (!policy || policy.mode === "allow_all") return false;
  const wl = policy.whitelist ?? [];
  if (policy.mode === "whitelist") return !wl.includes(toolName);
  return true;
}

export function parseWhitelistInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
