import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";

// ONE mock for ipc — covers both workspace and toolRunner imports.
const mockAcquire = vi.fn();
const mockWriteFile = vi.fn();
const mockReadFileRanged = vi.fn();

vi.mock("../../src/lib/ipc", () => ({
  acquireWorkspaceLock: (...a: unknown[]) => mockAcquire(...a),
  releaseWorkspaceLock: vi.fn().mockResolvedValue(undefined),
  readWorkspaceLock: vi.fn().mockResolvedValue(null),
  watchWorkspace: vi.fn().mockResolvedValue(undefined),
  addRecentProject: vi.fn().mockResolvedValue(undefined),
  listDir: vi.fn().mockResolvedValue([]),
  isTauriAvailable: () => true,
  writeFile: (...a: unknown[]) => mockWriteFile(...a),
  readFileRanged: (...a: unknown[]) => mockReadFileRanged(...a),
  readFile: vi.fn(),
  webFetch: vi.fn(),
  runShell: vi.fn(),
  deleteEntry: vi.fn(),
  renameEntry: vi.fn(),
  pathExists: vi.fn().mockResolvedValue(false),
  gitStatus: vi.fn(),
  gitLog: vi.fn(),
  gitDiff: vi.fn(),
  findFiles: vi.fn(),
  listDirTree: vi.fn(),
  grepWorkspace: vi.fn(),
}));

vi.mock("../../src/lib/projectState", () => ({
  switchProjectWorkspace: vi.fn().mockResolvedValue(undefined),
}));

import {
  workspaceReadOnly,
  pendingLockConflict,
  resolveLockConflict,
  applyWorkspaceFolder,
} from "../../src/lib/workspace";
import { executeTool } from "../../src/lib/tools/toolRunner";

// ---------------------------------------------------------------------------
// Workspace lock store
// ---------------------------------------------------------------------------

describe("workspaceLock store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceReadOnly.set(false);
    pendingLockConflict.set(null);
  });

  it("starts not read-only", () => {
    expect(get(workspaceReadOnly)).toBe(false);
  });

  it("acquires lock and opens normally when Acquired", async () => {
    mockAcquire.mockResolvedValue({ kind: "Acquired" });
    const opened = await applyWorkspaceFolder("/test/proj");
    expect(opened).toBe(true);
    expect(get(workspaceReadOnly)).toBe(false);
    expect(mockAcquire).toHaveBeenCalledWith("/test/proj");
  });

  it("opens read-only when user resolves conflict with 'open read-only'", async () => {
    const lockInfo = { pid: 9999, timestamp: "2026-01-01T00:00:00Z", hostname: "other" };
    mockAcquire.mockResolvedValue({ kind: "ConflictLive", lock_info: lockInfo });

    // Start applyWorkspaceFolder — it will pause at showLockConflictDialog.
    const openPromise = applyWorkspaceFolder("/test/proj");

    // Wait for pendingLockConflict to be set (one tick for the async acquire + set).
    await vi.waitFor(() => expect(get(pendingLockConflict)).not.toBeNull());

    expect(get(pendingLockConflict)).toEqual(lockInfo);

    // User clicks "Open read-only".
    resolveLockConflict(true);

    const opened = await openPromise;
    expect(opened).toBe(true);
    expect(get(workspaceReadOnly)).toBe(true);
    expect(get(pendingLockConflict)).toBeNull();
  });

  it("returns false and stays non-readonly when user cancels conflict", async () => {
    const lockInfo = { pid: 9999, timestamp: "2026-01-01T00:00:00Z", hostname: "other" };
    mockAcquire.mockResolvedValue({ kind: "ConflictLive", lock_info: lockInfo });

    const openPromise = applyWorkspaceFolder("/test/proj");
    await vi.waitFor(() => expect(get(pendingLockConflict)).not.toBeNull());

    // User clicks "Cancel".
    resolveLockConflict(false);

    const opened = await openPromise;
    expect(opened).toBe(false);
    expect(get(workspaceReadOnly)).toBe(false);
    expect(get(pendingLockConflict)).toBeNull();
  });

  it("proceeds without lock when acquire throws (degraded mode)", async () => {
    mockAcquire.mockRejectedValue(new Error("permission denied"));
    const opened = await applyWorkspaceFolder("/test/proj");
    expect(opened).toBe(true);
    expect(get(workspaceReadOnly)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Read-only write guard in toolRunner
// ---------------------------------------------------------------------------

describe("toolRunner read-only write guard", () => {
  const WS = "/test/workspace";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks write_file when readOnly is true", async () => {
    const result = await executeTool(
      "write_file",
      { path: "/test/workspace/file.txt", content: "hello" },
      WS,
      { readOnly: true }
    );
    expect(result.success).toBe(false);
    expect(result.output).toContain("read_only_mode");
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("blocks run_shell when readOnly is true", async () => {
    const result = await executeTool(
      "run_shell",
      { command: "rm -rf /" },
      WS,
      { readOnly: true }
    );
    expect(result.success).toBe(false);
    expect(result.output).toContain("read_only_mode");
  });

  it("allows read_file when readOnly is true", async () => {
    mockReadFileRanged.mockResolvedValue({ content: "hello", totalLines: 1, startLine: 1, endLine: 1 });
    const result = await executeTool(
      "read_file",
      { path: "/test/workspace/file.txt" },
      WS,
      { readOnly: true }
    );
    // Should reach the handler (success or fail based on mock, but NOT a read-only error).
    expect(result.output).not.toContain("read_only_mode");
  });

  it("allows write_file when readOnly is false", async () => {
    mockWriteFile.mockResolvedValue(undefined);
    const result = await executeTool(
      "write_file",
      { path: "/test/workspace/file.txt", content: "hello" },
      WS,
      { readOnly: false }
    );
    // write_file should proceed (may succeed or fail based on other logic, but not read-only blocked).
    expect(result.output).not.toContain("read_only_mode");
  });
});
