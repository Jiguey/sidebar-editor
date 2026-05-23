import { describe, it, expect } from "vitest";
import { formatGitStatus, formatGitLog } from "../../src/lib/tools/gitFormat";

describe("gitFormat", () => {
  it("formatGitStatus reports clean tree", () => {
    expect(formatGitStatus([])).toContain("clean");
  });

  it("formatGitStatus lists entries", () => {
    const out = formatGitStatus([
      { path: "src/a.ts", index: "M", worktree: "-" },
    ]);
    expect(out).toContain("src/a.ts");
    expect(out).toContain("M");
  });

  it("formatGitLog reports empty log", () => {
    expect(formatGitLog([])).toContain("No commits");
  });

  it("formatGitLog formats commits", () => {
    const out = formatGitLog([
      {
        oid: "abcdef1234567890",
        summary: "Initial commit",
        author: "Dev",
        time: 1_700_000_000,
      },
    ]);
    expect(out).toContain("abcdef1");
    expect(out).toContain("Initial commit");
    expect(out).toContain("Dev");
  });
});
