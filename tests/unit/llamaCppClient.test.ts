import { describe, expect, it } from "vitest";
import { parseLlamacppPropsJson } from "../../src/lib/llamaCppClient";

describe("parseLlamacppPropsJson", () => {
  it("reads n_ctx from default_generation_settings", () => {
    const info = parseLlamacppPropsJson({
      total_slots: 4,
      default_generation_settings: {
        n_ctx: 16384,
        model: "qwen.gguf",
        temperature: 0.7,
      },
    });
    expect(info.nCtx).toBe(16384);
    expect(info.model).toBe("qwen.gguf");
    expect(info.totalSlots).toBe(4);
    expect(info.generationDefaults?.temperature).toBe(0.7);
  });

  it("falls back to top-level n_ctx", () => {
    const info = parseLlamacppPropsJson({ n_ctx: 4096 });
    expect(info.nCtx).toBe(4096);
  });

  it("returns nulls for invalid payloads", () => {
    expect(parseLlamacppPropsJson(null)).toEqual({
      nCtx: null,
      model: null,
      totalSlots: null,
      generationDefaults: null,
    });
    expect(parseLlamacppPropsJson({ default_generation_settings: { n_ctx: 0 } }).nCtx).toBeNull();
  });
});
