import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";

// ---------------------------------------------------------------------------
// IPC mock — covers lspClient, lspSettings, lspStore imports
// ---------------------------------------------------------------------------

const mockSpawn = vi.fn();
const mockSend = vi.fn();
const mockStop = vi.fn();
let messageHandler: ((id: string, msg: unknown) => void) | null = null;
let exitHandler: ((id: string, code: number | null) => void) | null = null;
let tauriAvailable = true;

vi.mock("../../src/lib/ipc", () => ({
  spawnLsp: (...a: unknown[]) => mockSpawn(...a),
  lspSend: (...a: unknown[]) => mockSend(...a),
  lspStop: (...a: unknown[]) => mockStop(...a),
  listenLspMessage: (cb: (id: string, m: unknown) => void) => {
    messageHandler = cb;
    return Promise.resolve(() => { messageHandler = null; });
  },
  listenLspExit: (cb: (id: string, c: number | null) => void) => {
    exitHandler = cb;
    return Promise.resolve(() => { exitHandler = null; });
  },
  isTauriAvailable: () => tauriAvailable,
}));

import {
  isResponse,
  isNotification,
  DiagnosticSeverity,
  DEFAULT_LSP_SERVERS,
  LSP_BINARY_NAMES,
  type LspMessage,
} from "../../src/lib/lsp/lspProtocol";

// ---------------------------------------------------------------------------
// Protocol type guards
// ---------------------------------------------------------------------------

describe("lspProtocol type guards", () => {
  it("isResponse detects responses with id + result", () => {
    const m: LspMessage = { jsonrpc: "2.0", id: 1, result: {} };
    expect(isResponse(m)).toBe(true);
  });

  it("isResponse detects responses with id + error", () => {
    const m: LspMessage = { jsonrpc: "2.0", id: 1, error: { code: -1, message: "x" } };
    expect(isResponse(m)).toBe(true);
  });

  it("isNotification detects messages without id", () => {
    const m: LspMessage = { jsonrpc: "2.0", method: "textDocument/publishDiagnostics", params: {} };
    expect(isNotification(m)).toBe(true);
    expect(isResponse(m)).toBe(false);
  });

  it("requests (id + method) are neither pure response nor notification", () => {
    const m: LspMessage = { jsonrpc: "2.0", id: 1, method: "initialize" };
    expect(isNotification(m)).toBe(false);
    expect(isResponse(m)).toBe(false);
  });

  it("severity constants are correct LSP values", () => {
    expect(DiagnosticSeverity.Error).toBe(1);
    expect(DiagnosticSeverity.Warning).toBe(2);
    expect(DiagnosticSeverity.Information).toBe(3);
    expect(DiagnosticSeverity.Hint).toBe(4);
  });

  it("DEFAULT_LSP_SERVERS includes TypeScript, disabled by default", () => {
    const ts = DEFAULT_LSP_SERVERS.find((s) => s.language === "typescript");
    expect(ts).toBeDefined();
    expect(ts!.enabled).toBe(false);
    expect(ts!.args).toContain("--stdio");
  });

  it("LSP_BINARY_NAMES maps languages to binaries", () => {
    expect(LSP_BINARY_NAMES.typescript).toBe("typescript-language-server");
    expect(LSP_BINARY_NAMES.rust).toBe("rust-analyzer");
    expect(LSP_BINARY_NAMES.go).toBe("gopls");
  });
});

// ---------------------------------------------------------------------------
// Diagnostic severity → CodeMirror mapping
// ---------------------------------------------------------------------------

import { lspSeverityToCm, hoverContentsToString } from "../../src/lib/lsp/lspCodeMirror";

describe("lspSeverityToCm", () => {
  it("maps Error → error", () => {
    expect(lspSeverityToCm(1)).toBe("error");
  });
  it("maps Warning → warning", () => {
    expect(lspSeverityToCm(2)).toBe("warning");
  });
  it("maps Information and Hint → info", () => {
    expect(lspSeverityToCm(3)).toBe("info");
    expect(lspSeverityToCm(4)).toBe("info");
  });
  it("defaults undefined severity to error", () => {
    expect(lspSeverityToCm(undefined)).toBe("error");
  });
});

describe("hoverContentsToString", () => {
  it("handles plain string", () => {
    expect(hoverContentsToString({ contents: "hello" })).toBe("hello");
  });
  it("handles MarkupContent object", () => {
    expect(hoverContentsToString({ contents: { kind: "markdown", value: "**bold**" } })).toBe("**bold**");
  });
  it("joins array contents", () => {
    expect(
      hoverContentsToString({ contents: [{ kind: "plaintext", value: "a" }, { kind: "plaintext", value: "b" }] })
    ).toBe("a\n\nb");
  });
});

// ---------------------------------------------------------------------------
// lspSettings
// ---------------------------------------------------------------------------

describe("lspSettings", () => {
  beforeEach(() => {
    tauriAvailable = true;
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    } as unknown as Storage;
  });

  it("resolvedLanguageForLsp maps js/jsx/tsx to typescript", async () => {
    const { resolvedLanguageForLsp } = await import("../../src/lib/lsp/lspSettings");
    expect(resolvedLanguageForLsp("javascript")).toBe("typescript");
    expect(resolvedLanguageForLsp("jsx")).toBe("typescript");
    expect(resolvedLanguageForLsp("tsx")).toBe("typescript");
    expect(resolvedLanguageForLsp("typescript")).toBe("typescript");
    expect(resolvedLanguageForLsp("rust")).toBe("rust");
  });

  it("setLspServer updates and getLspConfigForLanguage reads it back", async () => {
    const { setLspServer, getLspConfigForLanguage } = await import("../../src/lib/lsp/lspSettings");
    setLspServer("typescript", { enabled: true, command: "/usr/bin/tsls" });
    const cfg = getLspConfigForLanguage("typescript");
    expect(cfg?.enabled).toBe(true);
    expect(cfg?.command).toBe("/usr/bin/tsls");
  });

  it("isLspEnabledForLanguage reflects config and Tauri availability", async () => {
    const { setLspServer, isLspEnabledForLanguage } = await import("../../src/lib/lsp/lspSettings");
    setLspServer("typescript", { enabled: true });
    expect(isLspEnabledForLanguage("typescript")).toBe(true);

    tauriAvailable = false;
    expect(isLspEnabledForLanguage("typescript")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LspClient JSON-RPC correlation
// ---------------------------------------------------------------------------

describe("LspClient request/response correlation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tauriAvailable = true;
    messageHandler = null;
    exitHandler = null;
    mockSpawn.mockResolvedValue("lsp-1");
    mockSend.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
  });

  it("start() spawns server and completes initialize handshake", async () => {
    const { LspClient } = await import("../../src/lib/lsp/lspClient");
    const client = new LspClient("tsls", ["--stdio"], "/ws", "typescript");

    const startPromise = client.start();
    // Wait a tick for the initialize request to be sent.
    await vi.waitFor(() => expect(mockSend).toHaveBeenCalled());

    // The first sent message is `initialize` with id 1 — respond to it.
    const firstCall = mockSend.mock.calls[0];
    const initMsg = firstCall[1] as { id: number; method: string };
    expect(initMsg.method).toBe("initialize");
    messageHandler?.("lsp-1", { jsonrpc: "2.0", id: initMsg.id, result: { capabilities: {} } });

    await startPromise;
    expect(client.isRunning).toBe(true);
    expect(mockSpawn).toHaveBeenCalledWith("tsls", ["--stdio"], "/ws");
  });

  it("routes publishDiagnostics to onDiagnostics callback", async () => {
    const { LspClient } = await import("../../src/lib/lsp/lspClient");
    const client = new LspClient("tsls", ["--stdio"], "/ws", "typescript");

    const diagsReceived: { uri: string; count: number }[] = [];
    client.onDiagnostics = (uri, diags) => diagsReceived.push({ uri, count: diags.length });

    const startPromise = client.start();
    await vi.waitFor(() => expect(mockSend).toHaveBeenCalled());
    const initMsg = mockSend.mock.calls[0][1] as { id: number };
    messageHandler?.("lsp-1", { jsonrpc: "2.0", id: initMsg.id, result: {} });
    await startPromise;

    messageHandler?.("lsp-1", {
      jsonrpc: "2.0",
      method: "textDocument/publishDiagnostics",
      params: {
        uri: "file:///ws/a.ts",
        diagnostics: [{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }, message: "err", severity: 1 }],
      },
    });

    expect(diagsReceived).toEqual([{ uri: "file:///ws/a.ts", count: 1 }]);
  });

  it("ignores messages from a different lspId", async () => {
    const { LspClient } = await import("../../src/lib/lsp/lspClient");
    const client = new LspClient("tsls", ["--stdio"], "/ws", "typescript");
    const diagsReceived: unknown[] = [];
    client.onDiagnostics = (uri, diags) => diagsReceived.push({ uri, diags });

    const startPromise = client.start();
    await vi.waitFor(() => expect(mockSend).toHaveBeenCalled());
    const initMsg = mockSend.mock.calls[0][1] as { id: number };
    messageHandler?.("lsp-1", { jsonrpc: "2.0", id: initMsg.id, result: {} });
    await startPromise;

    // Message for a different server should be ignored.
    messageHandler?.("lsp-OTHER", {
      jsonrpc: "2.0",
      method: "textDocument/publishDiagnostics",
      params: { uri: "file:///ws/b.ts", diagnostics: [] },
    });

    expect(diagsReceived).toHaveLength(0);
  });

  it("does nothing when Tauri is unavailable", async () => {
    tauriAvailable = false;
    const { LspClient } = await import("../../src/lib/lsp/lspClient");
    const client = new LspClient("tsls", ["--stdio"], "/ws", "typescript");
    await client.start();
    expect(mockSpawn).not.toHaveBeenCalled();
    expect(client.isRunning).toBe(false);
  });
});
