import { describe, it, expect, vi, beforeEach } from "vitest";

// --- web_fetch retry tests (toolRunner) ---

const mockWebFetch = vi.fn();
vi.mock("../../src/lib/ipc", () => ({
  readFile: vi.fn(),
  readFileRanged: vi.fn(),
  writeFile: vi.fn(),
  listDir: vi.fn(),
  grepWorkspace: vi.fn(),
  runShell: vi.fn(),
  deleteEntry: vi.fn(),
  renameEntry: vi.fn(),
  pathExists: vi.fn().mockResolvedValue(false),
  gitStatus: vi.fn(),
  gitLog: vi.fn(),
  gitDiff: vi.fn(),
  isTauriAvailable: vi.fn().mockReturnValue(true),
  webFetch: (...args: unknown[]) => mockWebFetch(...args),
  findFiles: vi.fn(),
  listDirTree: vi.fn(),
}));

import { executeTool, isRetryableError } from "../../src/lib/tools/toolRunner";
import { shouldContinueAgentStep } from "../../src/lib/agentLimits";

const WS = "/test/workspace";
const HOSTS = ["example.com"];

describe("isRetryableError", () => {
  it("matches connection refused", () => {
    expect(isRetryableError(new Error("connection refused"))).toBe(true);
    expect(isRetryableError(new Error("ECONNREFUSED"))).toBe(true);
  });

  it("matches timeout signals", () => {
    expect(isRetryableError(new Error("ETIMEDOUT: operation timed out"))).toBe(true);
    expect(isRetryableError(new Error("timed out waiting for response"))).toBe(true);
    expect(isRetryableError(new Error("network error"))).toBe(true);
  });

  it("matches DNS failures", () => {
    expect(isRetryableError(new Error("DNS resolution failed"))).toBe(true);
    expect(isRetryableError(new Error("no such host"))).toBe(true);
  });

  it("does NOT match HTTP errors or non-network failures", () => {
    expect(isRetryableError(new Error("403 Forbidden"))).toBe(false);
    expect(isRetryableError(new Error("not in allowlist"))).toBe(false);
    expect(isRetryableError(new Error("malformed url"))).toBe(false);
    expect(isRetryableError(new Error("500 Internal Server Error"))).toBe(false);
  });

  it("handles non-Error values", () => {
    expect(isRetryableError("connection refused")).toBe(true);
    expect(isRetryableError("500 error")).toBe(false);
  });
});

describe("web_fetch retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("succeeds on first attempt without retry", async () => {
    mockWebFetch.mockResolvedValue("<html>page</html>");
    const result = await executeTool(
      "web_fetch", { url: "http://example.com" }, WS,
      { webFetchAllowedHosts: HOSTS }
    );
    expect(result.success).toBe(true);
    expect(mockWebFetch).toHaveBeenCalledTimes(1);
  });

  it("retries once on network error and succeeds", async () => {
    mockWebFetch
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValue("<html>page</html>");

    const promise = executeTool(
      "web_fetch", { url: "http://example.com" }, WS,
      { webFetchAllowedHosts: HOSTS }
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.output).toContain("page");
    expect(mockWebFetch).toHaveBeenCalledTimes(2);
  });

  it("returns error after exhausting retry and calls onNetworkRetryExhausted", async () => {
    mockWebFetch.mockRejectedValue(new Error("connection refused"));
    const onExhausted = vi.fn();

    const promise = executeTool(
      "web_fetch", { url: "http://example.com" }, WS,
      { webFetchAllowedHosts: HOSTS, onNetworkRetryExhausted: onExhausted }
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.output).toContain("network_error");
    expect(result.output).toContain("retried once");
    expect(mockWebFetch).toHaveBeenCalledTimes(2);
    expect(onExhausted).toHaveBeenCalledOnce();
    expect(onExhausted).toHaveBeenCalledWith("Network error — fetch failed after retry");
  });

  it("does NOT retry non-retryable errors", async () => {
    mockWebFetch.mockRejectedValue(new Error("403 Forbidden"));
    const onExhausted = vi.fn();

    const result = await executeTool(
      "web_fetch", { url: "http://example.com" }, WS,
      { webFetchAllowedHosts: HOSTS, onNetworkRetryExhausted: onExhausted }
    );

    expect(result.success).toBe(false);
    expect(mockWebFetch).toHaveBeenCalledTimes(1);
    expect(onExhausted).not.toHaveBeenCalled();
  });

  it("fails immediately when no hosts configured", async () => {
    const result = await executeTool(
      "web_fetch", { url: "http://example.com" }, WS,
      { webFetchAllowedHosts: [] }
    );
    expect(result.success).toBe(false);
    expect(result.output).toContain("No web fetch hosts");
    expect(mockWebFetch).not.toHaveBeenCalled();
  });
});

describe("shouldContinueAgentStep (step-limit UX)", () => {
  it("allows unlimited steps when maxAgentSteps is 0", () => {
    const limits = { maxAgentSteps: 0, maxToolCallsPerRun: 0, maxToolsPerTurn: 0, parallelExecution: false, maxConcurrentTools: 4 };
    for (let i = 0; i < 1000; i++) {
      expect(shouldContinueAgentStep(i, limits)).toBe(true);
    }
  });

  it("stops at the configured cap", () => {
    const limits = { maxAgentSteps: 5, maxToolCallsPerRun: 0, maxToolsPerTurn: 0, parallelExecution: false, maxConcurrentTools: 4 };
    expect(shouldContinueAgentStep(0, limits)).toBe(true);
    expect(shouldContinueAgentStep(4, limits)).toBe(true);
    expect(shouldContinueAgentStep(5, limits)).toBe(false);
    expect(shouldContinueAgentStep(10, limits)).toBe(false);
  });

  it("resumes from zero after continuing (override resets step counter)", () => {
    // Simulates clicking "Continue for N more steps": a fresh loop starts at step=0
    // with a new agentLimits that has maxAgentSteps=N.
    const overrideLimits = { maxAgentSteps: 5, maxToolCallsPerRun: 0, maxToolsPerTurn: 0, parallelExecution: false, maxConcurrentTools: 4 };
    expect(shouldContinueAgentStep(0, overrideLimits)).toBe(true);
    expect(shouldContinueAgentStep(4, overrideLimits)).toBe(true);
    expect(shouldContinueAgentStep(5, overrideLimits)).toBe(false);
  });
});
