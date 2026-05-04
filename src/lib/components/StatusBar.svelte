<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { settings } from "../stores/settings";
  import { backendStatus, pollBackendHealth } from "../stores/backendStatus";

  const POLL_MS = 10_000;
  let timer: ReturnType<typeof setInterval> | null = null;

  async function tick() {
    const line = await pollBackendHealth({
      chatBackend: $settings.chatBackend,
      selectedModel: $settings.selectedModel,
      ollamaEndpoint: $settings.ollamaEndpoint,
      llamacppEndpoint: $settings.llamacppEndpoint,
      anthropicApiKey: $settings.apiKeys.anthropic,
    });
    backendStatus.set(line);
  }

  onMount(() => {
    void tick();
    timer = setInterval(() => void tick(), POLL_MS);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });

  $effect(() => {
    void [
      $settings.chatBackend,
      $settings.selectedModel,
      $settings.ollamaEndpoint,
      $settings.llamacppEndpoint,
      $settings.apiKeys.anthropic,
    ];
    void tick();
  });
</script>

<div class="status-bar" role="status" aria-live="polite">
  <span class="status-label">{$backendStatus.label}</span>
  <span class="status-dot" class:green={$backendStatus.dot === "green"} class:red={$backendStatus.dot === "red"} class:yellow={$backendStatus.dot === "yellow"} class:idle={$backendStatus.dot === "idle"} title={$backendStatus.detail}></span>
  <span class="status-detail">{$backendStatus.detail}</span>
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    padding: 0 12px;
    font-size: 11px;
    color: #a0a0a0;
    background: #252526;
    border-top: 1px solid #3c3c3c;
    flex-shrink: 0;
    min-width: 0;
  }

  .status-label {
    font-weight: 600;
    color: #cccccc;
    flex-shrink: 0;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #555;
  }

  .status-dot.green {
    background: #3fb950;
    box-shadow: 0 0 6px rgba(63, 185, 80, 0.45);
  }

  .status-dot.red {
    background: #f85149;
    box-shadow: 0 0 6px rgba(248, 81, 73, 0.35);
  }

  .status-dot.yellow {
    background: #d29922;
    box-shadow: 0 0 6px rgba(210, 153, 34, 0.4);
  }

  .status-dot.idle {
    background: #555;
  }

  .status-detail {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
</style>
