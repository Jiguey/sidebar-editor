import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  searchModels,
  getPopularModels,
  formatModelWithTag,
  pullModel,
  deleteModel,
  formatBytes,
  formatPullProgress,
} from "../../src/lib/ollamaLibrary";

describe("ollamaLibrary", () => {
  describe("getPopularModels", () => {
    it("returns an array of models", () => {
      const models = getPopularModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it("each model has required properties", () => {
      const models = getPopularModels();
      for (const model of models) {
        expect(model.name).toBeTruthy();
        expect(model.description).toBeTruthy();
        expect(Array.isArray(model.tags)).toBe(true);
        expect(model.tags.length).toBeGreaterThan(0);
      }
    });

    it("includes popular models like llama and qwen", () => {
      const models = getPopularModels();
      const names = models.map((m) => m.name);
      expect(names.some((n) => n.includes("llama"))).toBe(true);
      expect(names.some((n) => n.includes("qwen"))).toBe(true);
    });
  });

  describe("searchModels", () => {
    it("returns all models for empty query", () => {
      const all = getPopularModels();
      const results = searchModels("");
      expect(results.length).toBe(all.length);
    });

    it("filters by name", () => {
      const results = searchModels("llama");
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((m) => m.name.toLowerCase().includes("llama"))).toBe(true);
    });

    it("filters by description", () => {
      const results = searchModels("code");
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (m) =>
            m.description.toLowerCase().includes("code") ||
            m.name.toLowerCase().includes("code")
        )
      ).toBe(true);
    });

    it("filters by tag", () => {
      const results = searchModels("7b");
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every((m) => m.tags.some((t) => t.toLowerCase().includes("7b")))
      ).toBe(true);
    });

    it("is case insensitive", () => {
      const lower = searchModels("llama");
      const upper = searchModels("LLAMA");
      const mixed = searchModels("LLama");
      expect(lower.length).toBe(upper.length);
      expect(lower.length).toBe(mixed.length);
    });
  });

  describe("formatModelWithTag", () => {
    it("combines name and tag with colon", () => {
      expect(formatModelWithTag("llama3.2", "1b")).toBe("llama3.2:1b");
      expect(formatModelWithTag("qwen2.5", "7b")).toBe("qwen2.5:7b");
    });
  });

  describe("formatBytes", () => {
    it("formats bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(100)).toBe("100 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });
  });

  describe("formatPullProgress", () => {
    it("formats progress with percentage when total and completed present", () => {
      const result = formatPullProgress({
        status: "downloading",
        total: 1000,
        completed: 500,
      });
      expect(result).toContain("50%");
      expect(result).toContain("downloading");
    });

    it("returns just status when no total/completed", () => {
      const result = formatPullProgress({ status: "verifying sha256" });
      expect(result).toBe("verifying sha256");
    });
  });

  describe("pullModel", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("sends POST request to correct endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"status":"success"}\n'),
            }).mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      });
      global.fetch = mockFetch;

      await pullModel("http://localhost:11434", "llama3.2:1b");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/pull",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "llama3.2:1b", stream: true }),
        })
      );
    });

    it("returns error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const result = await pullModel("http://localhost:11434", "model");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("returns error on non-OK response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Model not found",
      });

      const result = await pullModel("http://localhost:11434", "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to pull");
    });

    it("calls progress callback during streaming", async () => {
      const progressCallback = vi.fn();
      const encoder = new TextEncoder();
      let callCount = 0;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  return Promise.resolve({
                    done: false,
                    value: encoder.encode('{"status":"downloading","completed":500,"total":1000}\n'),
                  });
                }
                if (callCount === 2) {
                  return Promise.resolve({
                    done: false,
                    value: encoder.encode('{"status":"success"}\n'),
                  });
                }
                return Promise.resolve({ done: true });
              }),
            releaseLock: vi.fn(),
          }),
        },
      });

      await pullModel("http://localhost:11434", "model", progressCallback);

      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe("deleteModel", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("sends DELETE request to correct endpoint", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await deleteModel("http://localhost:11434", "model:tag");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/delete",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ name: "model:tag" }),
        })
      );
    });

    it("returns success on OK response", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const result = await deleteModel("http://localhost:11434", "model");

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Model in use",
      });

      const result = await deleteModel("http://localhost:11434", "model");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to delete");
    });
  });
});
