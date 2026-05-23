import { describe, it, expect } from "vitest";
import { resolvePath, assertWithinWorkspace, resolveWorkspacePath } from "../../src/lib/tools/pathUtils";

describe("pathUtils", () => {
  const workspace = "/test/workspace";

  it("resolvePath joins relative paths", () => {
    expect(resolvePath(workspace, "src/a.ts")).toBe("/test/workspace/src/a.ts");
  });

  it("resolvePath keeps absolute paths", () => {
    expect(resolvePath(workspace, "/etc/passwd")).toBe("/etc/passwd");
  });

  it("assertWithinWorkspace allows paths under workspace", () => {
    expect(() =>
      assertWithinWorkspace(workspace, "/test/workspace/src/a.ts")
    ).not.toThrow();
  });

  it("assertWithinWorkspace rejects paths outside workspace", () => {
    expect(() => assertWithinWorkspace(workspace, "/other/file")).toThrow(/outside the workspace/);
  });

  it("resolveWorkspacePath rejects escape via absolute path", () => {
    expect(() => resolveWorkspacePath(workspace, "/etc/passwd")).toThrow(/outside the workspace/);
  });
});
