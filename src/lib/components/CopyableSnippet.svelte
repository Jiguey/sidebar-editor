<script lang="ts">
  let {
    label,
    text,
    mono = true,
    compact = false,
  }: {
    label: string;
    text: string;
    mono?: boolean;
    compact?: boolean;
  } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      /* ignore */
    }
  }
</script>

<div class="copyable-snippet" class:copyable-snippet--compact={compact}>
  <div class="copyable-head">
    <span class="copyable-label">{label}</span>
    <button type="button" class="btn ghost copy-btn" onclick={() => void copy()}>
      {copied ? "Copied" : "Copy"}
    </button>
  </div>
  <pre class="copyable-body" class:mono>{text}</pre>
</div>

<style>
  .copyable-snippet {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--muted);
  }

  .copyable-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  }

  .copyable-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted-foreground);
  }

  .copy-btn {
    font-size: 11px;
    padding: 2px 8px;
    min-height: 0;
  }

  .copyable-body {
    margin: 0;
    padding: 10px 12px;
    font-size: 11px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--foreground);
    max-height: 240px;
    overflow: auto;
  }

  .copyable-body.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .copyable-snippet--compact {
    background: #141414;
    border-color: #404040;
  }

  .copyable-snippet--compact .copyable-head {
    padding: 8px 12px;
    background: #222;
  }

  .copyable-snippet--compact .copyable-label {
    font-size: 12px;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
    color: #c8c8c8;
  }

  .copyable-snippet--compact .copyable-body {
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.5;
    max-height: 200px;
    color: #e0e0e0;
  }

  .copyable-snippet--compact .copy-btn {
    font-size: 12px;
    padding: 4px 10px;
  }
</style>
