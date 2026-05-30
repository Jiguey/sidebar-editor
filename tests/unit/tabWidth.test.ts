import { describe, expect, it } from "vitest";
import {
  DEFAULT_TAB_UNIFORM_WIDTH_PX,
  normalizeUniformTabWidthPx,
} from "../../src/lib/editor/tabWidth";

describe("tabWidth", () => {
  it("defaults to 96px", () => {
    expect(DEFAULT_TAB_UNIFORM_WIDTH_PX).toBe(96);
    expect(normalizeUniformTabWidthPx(undefined)).toBe(96);
  });

  it("clamps out of range values", () => {
    expect(normalizeUniformTabWidthPx(40)).toBe(64);
    expect(normalizeUniformTabWidthPx(300)).toBe(220);
    expect(normalizeUniformTabWidthPx(120)).toBe(120);
  });
});
