import { describe, expect, it } from "vitest";
import { isLocalPreviewUrl } from "../../src/lib/previewUrl";

describe("isLocalPreviewUrl", () => {
  it("allows localhost and 127.0.0.1 with port", () => {
    expect(isLocalPreviewUrl("http://127.0.0.1:5173")).toBe(true);
    expect(isLocalPreviewUrl("http://localhost:3000/path")).toBe(true);
    expect(isLocalPreviewUrl("https://127.0.0.1:8080")).toBe(true);
  });

  it("rejects remote and non-http URLs", () => {
    expect(isLocalPreviewUrl("https://example.com")).toBe(false);
    expect(isLocalPreviewUrl("file:///etc/passwd")).toBe(false);
    expect(isLocalPreviewUrl("not-a-url")).toBe(false);
  });
});
