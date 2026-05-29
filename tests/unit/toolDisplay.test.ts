import { describe, expect, it } from "vitest";
import {
  formatToolSummary,
  openableFilePaths,
  pathsFromToolInput,
  toolCompactLabel,
  toolFileLine,
  toolResultIsError,
  workspaceRelativePath,
} from "../../src/lib/agent/toolDisplay";

describe("toolDisplay", () => {
  it("summarizes write_file with path", () => {
    expect(formatToolSummary("write_file", { path: "testing.txt" })).toBe("testing.txt");
  });

  it("compact label shortens file tools", () => {
    expect(toolCompactLabel("write_file")).toBe("write");
    expect(toolCompactLabel("get_git_status")).toBe("git status");
  });

  it("file line resolves workspace-relative path", () => {
    expect(
      toolFileLine("write_file", { path: "three-little-pigs.md" }, "/mnt/data/git/tiny-llama")
    ).toBe("three-little-pigs.md");
  });

  it("summarizes run_shell with command", () => {
    expect(formatToolSummary("run_shell", { command: "git status" })).toBe("git status");
  });

  it("resolves workspace paths from tool input", () => {
    const paths = pathsFromToolInput(
      "write_file",
      { path: "src/main.ts" },
      "/mnt/data/git/tiny-llama"
    );
    expect(paths).toEqual(["/mnt/data/git/tiny-llama/src/main.ts"]);
  });

  it("returns openable paths for successful write", () => {
    const paths = openableFilePaths(
      "write_file",
      { path: "testing.txt" },
      "/mnt/data/git/tiny-llama",
      true
    );
    expect(paths).toEqual(["/mnt/data/git/tiny-llama/testing.txt"]);
  });

  it("shows workspace-relative labels", () => {
    expect(workspaceRelativePath("/mnt/data/git/tiny-llama", "/mnt/data/git/tiny-llama/testing.txt")).toBe(
      "testing.txt"
    );
  });

  it("detects error output", () => {
    expect(toolResultIsError("Error: Path does not exist")).toBe(true);
    expect(toolResultIsError("Successfully wrote to testing.txt")).toBe(false);
  });
});
