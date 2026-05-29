import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderChatMarkdown(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "";
  const raw = marked.parse(trimmed, { async: false }) as string;
  return sanitizeChatHtml(raw);
}

/** Minimal sanitization for model-generated HTML (desktop local context). */
function sanitizeChatHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}
