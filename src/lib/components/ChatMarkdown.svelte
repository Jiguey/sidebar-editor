<script lang="ts">
  import { renderChatMarkdown } from "$lib/chat/renderMarkdown";

  let {
    content = "",
    /** `muted` — thinking-style body (softer than response). */
    tone = "default",
  }: {
    content: string;
    tone?: "default" | "muted";
  } = $props();

  let html = $derived(renderChatMarkdown(content));
</script>

{#if html}
  <div class="chat-markdown" class:muted={tone === "muted"}>{@html html}</div>
{/if}

<style>
  .chat-markdown {
    width: 100%;
    min-width: 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--foreground);
    word-break: break-word;
  }

  .chat-markdown.muted {
    color: color-mix(in srgb, var(--muted-foreground) 88%, var(--foreground));
  }

  .chat-markdown :global(:first-child) {
    margin-top: 0;
  }

  .chat-markdown :global(:last-child) {
    margin-bottom: 0;
  }

  .chat-markdown :global(p) {
    margin: 0 0 0.65em;
  }

  .chat-markdown :global(h1),
  .chat-markdown :global(h2),
  .chat-markdown :global(h3),
  .chat-markdown :global(h4) {
    margin: 0.85em 0 0.4em;
    font-weight: 600;
    line-height: 1.3;
    color: inherit;
  }

  .chat-markdown :global(h1) {
    font-size: 1.15em;
  }

  .chat-markdown :global(h2) {
    font-size: 1.08em;
  }

  .chat-markdown :global(h3),
  .chat-markdown :global(h4) {
    font-size: 1em;
  }

  .chat-markdown :global(ul),
  .chat-markdown :global(ol) {
    margin: 0 0 0.65em;
    padding-left: 1.35em;
  }

  .chat-markdown :global(li) {
    margin: 0.2em 0;
  }

  .chat-markdown :global(li > p) {
    margin: 0;
  }

  .chat-markdown :global(blockquote) {
    margin: 0 0 0.65em;
    padding-left: 0.75em;
    border-left: 2px solid var(--border);
    color: var(--muted-foreground);
  }

  .chat-markdown :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.92em;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    background: color-mix(in srgb, var(--muted) 70%, transparent);
  }

  .chat-markdown :global(pre) {
    margin: 0 0 0.65em;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--muted);
    overflow-x: auto;
  }

  .chat-markdown :global(pre code) {
    padding: 0;
    background: transparent;
    font-size: 0.9em;
    line-height: 1.45;
  }

  .chat-markdown :global(a) {
    color: var(--primary);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .chat-markdown :global(hr) {
    margin: 0.75em 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  .chat-markdown :global(table) {
    width: 100%;
    margin: 0 0 0.65em;
    border-collapse: collapse;
    font-size: 0.95em;
  }

  .chat-markdown :global(th),
  .chat-markdown :global(td) {
    padding: 4px 8px;
    border: 1px solid var(--border);
    text-align: left;
  }
</style>
