<script lang="ts">
  let {
    label,
    text,
    mono = true,
  }: {
    label: string;
    text: string;
    mono?: boolean;
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

<div class="copyable-snippet">
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
</style>
