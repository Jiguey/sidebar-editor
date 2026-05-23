import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  probeOllama,
  probeLlamacpp,
  portFromBaseUrl,
  stopServerOnPortCommand,
  startOllamaServeCommand,
} from "../../src/lib/providerHealth";

describe("providerHealth", () => {
  describe("portFromBaseUrl", () => {
    it("parses explicit port", () => {
      expect(portFromBaseUrl("http://127.0.0.1:11434", 11434)).toBe(11434);
      expect(portFromBaseUrl("http://localhost:8080/v1", 8080)).toBe(8080);
    });

    it("uses default when port omitted", () => {
      expect(portFromBaseUrl("http://127.0.0.1", 11434)).toBe(11434);
    });
  });

  describe("probeOllama", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns green when version and tags succeed", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ version: "0.5.0" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [{ name: "llama3.2:1b" }] }),
        });

      const h = await probeOllama("http://127.0.0.1:11434");
      expect(h.dot).toBe("green");
      expect(h.modelCount).toBe(1);
      expect(h.detail).toContain("Connected");
    });

    it("returns red when unreachable", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
      const h = await probeOllama("http://127.0.0.1:11434");
      expect(h.dot).toBe("red");
      expect(h.modelCount).toBe(0);
    });

    it("returns yellow when no models", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) });

      const h = await probeOllama("http://127.0.0.1:11434");
      expect(h.dot).toBe("yellow");
      expect(h.modelCount).toBe(0);
    });
  });

  describe("probeLlamacpp", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns green with models", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: "local-model" }] }),
      });

      const h = await probeLlamacpp("http://127.0.0.1:8080");
      expect(h.dot).toBe("green");
      expect(h.modelCount).toBe(1);
    });

    it("returns red on failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("fail"));
      const h = await probeLlamacpp("http://127.0.0.1:8080");
      expect(h.dot).toBe("red");
    });
  });

  describe("shell helpers", () => {
    it("stopServerOnPortCommand includes port", () => {
      expect(stopServerOnPortCommand(8080)).toContain("8080");
    });

    it("startOllamaServeCommand runs serve", () => {
      expect(startOllamaServeCommand()).toContain("ollama serve");
    });
  });
});
