import type { GitLogEntry, GitPathStatus } from "../gitTypes";

export function formatGitStatus(entries: GitPathStatus[]): string {
  if (entries.length === 0) {
    return "Working tree clean (no changes).";
  }
  return entries
    .map((e) => `${e.index}${e.worktree}  ${e.path}`)
    .join("\n");
}

export function formatGitLog(entries: GitLogEntry[]): string {
  if (entries.length === 0) {
    return "No commits found.";
  }
  return entries
    .map((e) => {
      const date = new Date(e.time * 1000).toISOString().slice(0, 10);
      const shortOid = e.oid.slice(0, 7);
      return `${shortOid} ${date} ${e.author}\n  ${e.summary}`;
    })
    .join("\n\n");
}
