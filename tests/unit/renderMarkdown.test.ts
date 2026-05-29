import { describe, expect, it } from "vitest";
import { renderChatMarkdown } from "../../src/lib/chat/renderMarkdown";

describe("renderChatMarkdown", () => {
  it("renders headings without raw hash markers", () => {
    const html = renderChatMarkdown("## Summary\n\nHello.");
    expect(html).toContain("<h2>");
    expect(html).toContain("Summary");
    expect(html).not.toMatch(/##\s+Summary/);
  });

  it("renders lists and emphasis", () => {
    const html = renderChatMarkdown("- one\n- **two**");
    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>two</strong>");
  });

  it("strips script tags", () => {
    const html = renderChatMarkdown('<script>alert(1)</script>\n\n## Hi');
    expect(html).not.toContain("<script");
    expect(html).toContain("<h2>");
  });
});
