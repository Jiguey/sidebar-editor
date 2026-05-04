import type { HarnessConfig } from "./types.js";

export function toolNeedsUserApproval(toolName: string, config: HarnessConfig): boolean {
  const policy = config.toolPolicy;
  if (!policy || policy.mode === "allow_all") return false;
  const wl = policy.whitelist ?? [];
  if (policy.mode === "whitelist") return !wl.includes(toolName);
  return true;
}
