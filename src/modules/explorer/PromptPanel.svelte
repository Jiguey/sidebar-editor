<script lang="ts">
  import { systemPrompt } from "$lib/stores/systemPrompt";
  import { files } from "$lib/stores/files";
  import { isTauriAvailable } from "$lib/ipc";
  import { onMount } from "svelte";
  import FloppyDiskIcon from "phosphor-svelte/lib/FloppyDiskIcon";
  import ArrowCounterClockwiseIcon from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";

  let draft = $state("");
  let saving = $state(false);
  let dirty = $state(false);
  let error = $state<string | null>(null);
  let loaded = $state(false);

  $effect(() => {
    draft = $systemPrompt;
    dirty = false;
    loaded = true;
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    draft = target.value;
    dirty = draft !== $systemPrompt;
    error = null;
  }

  async function save() {
    if (!$files.workspacePath || saving) return;

    saving = true;
    error = null;

    try {
      await systemPrompt.save($files.workspacePath, draft);
      dirty = false;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = false;
    }
  }

  function reset() {
    draft = $systemPrompt;
    dirty = false;
    error = null;
  }

  onMount(async () => {
    if (isTauriAvailable() && $files.workspacePath) {
      await systemPrompt.load($files.workspacePath);
    }
  });

  $effect(() => {
    if ($files.workspacePath && isTauriAvailable()) {
      systemPrompt.load($files.workspacePath);
    }
  });
</script>

<div class="prompt-panel">
  <div class="prompt-header">
    <div class="prompt-title">
      <h3>System Prompt</h3>
      <span class="prompt-path">.tinyllama/prompt.md</span>
    </div>
    <div class="prompt-actions">
      {#if dirty}
        <button
          type="button"
          class="prompt-action-btn"
          onclick={reset}
          title="Discard changes"
          aria-label="Discard changes"
        >
          <ArrowCounterClockwiseIcon size={16} />
        </button>
      {/if}
      <button
        type="button"
        class="prompt-action-btn prompt-action-btn--primary"
        onclick={save}
        disabled={saving || !dirty}
        title="Save"
        aria-label="Save system prompt"
      >
        <FloppyDiskIcon size={16} />
      </button>
    </div>
  </div>

  {#if error}
    <div class="prompt-error" role="alert">
      {error}
    </div>
  {/if}

  <div class="prompt-content">
    <textarea
      class="prompt-textarea"
      value={draft}
      oninput={handleInput}
      placeholder="Custom instructions for the AI assistant...

Example:
- Always use TypeScript
- Prefer functional components
- Follow the project's existing code style"
      rows="10"
      disabled={!$files.workspacePath}
    ></textarea>
  </div>

  <div class="prompt-footer">
    <span class="prompt-hint">
      {#if dirty}
        <span class="prompt-dirty-indicator">Unsaved changes</span>
      {:else if loaded && !$systemPrompt}
        No custom prompt configured
      {:else}
        Appended to mode's base prompt
      {/if}
    </span>
  </div>
</div>

<style>
  .prompt-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .prompt-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 12px 8px;
    flex-shrink: 0;
  }

  .prompt-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .prompt-title h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--foreground);
  }

  .prompt-path {
    font-size: 10px;
    color: var(--muted-foreground);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .prompt-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .prompt-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
  }

  .prompt-action-btn:hover:not(:disabled) {
    background: var(--muted);
    color: var(--foreground);
  }

  .prompt-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .prompt-action-btn--primary {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .prompt-action-btn--primary:hover:not(:disabled) {
    background: var(--primary);
    filter: brightness(1.1);
  }

  .prompt-action-btn :global(svg) {
    width: 14px;
    height: 14px;
  }

  .prompt-error {
    margin: 0 12px 8px;
    padding: 8px 10px;
    font-size: 11px;
    color: #f48771;
    background: rgba(244, 135, 113, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(244, 135, 113, 0.3);
  }

  .prompt-content {
    flex: 1;
    min-height: 0;
    padding: 0 12px;
  }

  .prompt-textarea {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 120px;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--background);
    color: var(--foreground);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    resize: none;
  }

  .prompt-textarea::placeholder {
    color: var(--muted-foreground);
  }

  .prompt-textarea:focus {
    outline: none;
    border-color: var(--ring);
  }

  .prompt-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .prompt-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px 12px;
    flex-shrink: 0;
  }

  .prompt-hint {
    font-size: 10px;
    color: var(--muted-foreground);
  }

  .prompt-dirty-indicator {
    color: #dcdcaa;
  }
</style>
