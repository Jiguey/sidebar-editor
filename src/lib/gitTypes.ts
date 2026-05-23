/** Shared git view types (spec §5) — mirrors Rust serde payloads. */

export type GitPathStatus = {
  path: string;
  /** Short tag: `M` modified, `A` added, `D` deleted, `??` untracked, … */
  index: string;
  worktree: string;
};

export type GitLogEntry = {
  oid: string;
  summary: string;
  author: string;
  time: number;
};
