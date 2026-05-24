import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import { files } from "../../src/lib/stores/files";
import {
  workbench,
  activeEditorFile,
  activeWorkbenchTab,
  workbenchEditorTabId,
} from "../../src/lib/stores/workbench";
import { buildWorkspaceTree } from "../../src/lib/workspace";

describe("workbench editor sync", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    workbench.reset();
    files.resetForTests();
  });

  it("resolves activeEditorFile from active editor tab path", () => {
    const path = "/proj/src/app.ts";
    files.openFile({
      path,
      name: "app.ts",
      content: "export {}",
      isDirty: false,
      language: "typescript",
    });
    workbench.ensureEditorTab(path, "app.ts");

    const tab = get(activeWorkbenchTab);
    const file = get(activeEditorFile);

    expect(tab?.kind).toBe("editor");
    expect(tab?.path).toBe(path);
    expect(file?.path).toBe(path);
    expect(file?.content).toBe("export {}");
  });

  it("openEditorFile opens buffer and activates tab atomically", () => {
    const path = "/proj/readme.md";
    workbench.openEditorFile({
      path,
      name: "readme.md",
      content: "# Hi",
      isDirty: false,
      language: "markdown",
    });

    expect(get(workbench).activeTabId).toBe(workbenchEditorTabId(path));
    expect(get(activeEditorFile)?.content).toBe("# Hi");
    expect(get(files).openFiles).toHaveLength(1);
  });

  it("setActiveTab switches activeEditorFile to matching buffer", () => {
    workbench.openEditorFile({
      path: "/proj/a.ts",
      name: "a.ts",
      content: "a",
      isDirty: false,
      language: "typescript",
    });
    workbench.openEditorFile({
      path: "/proj/b.ts",
      name: "b.ts",
      content: "b",
      isDirty: false,
      language: "typescript",
    });

    workbench.setActiveTab(workbenchEditorTabId("/proj/a.ts"));
    expect(get(activeEditorFile)?.content).toBe("a");
  });

  it("activeEditorFile is null when active tab is terminal", () => {
    workbench.openEditorFile({
      path: "/proj/a.ts",
      name: "a.ts",
      content: "a",
      isDirty: false,
      language: "typescript",
    });
    workbench.addTerminalTab("sess-1");

    expect(get(activeWorkbenchTab)?.kind).toBe("terminal");
    expect(get(activeEditorFile)).toBeNull();
  });

  it("workspace root path matches files.workspacePath for agent cwd", () => {
    const root = buildWorkspaceTree("/home/user/proj", [
      { name: "a.ts", path: "/home/user/proj/a.ts", is_dir: false },
    ]);
    files.setWorkspacePath("/home/user/proj");
    files.setTree(root);

    expect(get(files).workspacePath).toBe("/home/user/proj");
    expect(get(files).tree[0].path).toBe("/home/user/proj");
    expect(get(files).tree[0].is_dir).toBe(true);
  });
});
