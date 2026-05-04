<script lang="ts">
  import { get } from "svelte/store";
  import { chat, activeSession, recentClosedChats } from "../stores/chat";
  import { settings, AVAILABLE_MODELS, type ModelConfig } from "../stores/settings";
  import { toolPolicy as toolPolicyStore } from "../stores/toolPolicy";
  import { files } from "../stores/files";
  import { estimateChatContextTokens } from "../chatContext";
  import {
    fetchOllamaModelList,
    RECOMMENDED_OLLAMA_MODELS,
    pickContextOption,
  } from "../ollamaClient";
  import { reduceHarnessStreamDisplay } from "../harnessStreamDisplay";
  import { onMount, onDestroy } from "svelte";
  import {
    startHarness,
    sendToHarness,
    listenHarnessEvents,
    isTauriAvailable,
    type HarnessEvent,
  } from "../ipc";

  let inputValue = $state("");
  let messagesContainer: HTMLDivElement;
  let tabScroll: HTMLDivElement;
  let sidecarSpawned = $state(false);
  let unlisten: (() => void) | null = null;
  let streamingContent = $state("");
  /** Claude extended thinking (streams via sidecar `thinking` events). */
  let streamingThinking = $state("");
  let thinkingPanelEl: HTMLDivElement | undefined;
  /** Wall-clock start of current assistant stream (first RPC token may arrive later). */
  let streamWallStartMs = 0;
  /** First assistant/thinking delta timestamp — preferred for tok/s. */
  let streamFirstTokenAt = 0;
  /** Rolling average output tokens/sec from the last completed reply (usage-based). */
  let lastTokPerSec = $state<number | null>(null);
  let pendingToolApproval = $state<{ id: string; tool: string; input: unknown } | null>(null);
  let modelMenuOpen = $state(false);
  let modelMenuEl: HTMLDivElement | undefined = $state();

  type OllamaMenuRow = { id: string; name: string; installed: boolean };

  function buildOllamaMenuRows(installed: ModelConfig[]): OllamaMenuRow[] {
    const map = new Map<string, OllamaMenuRow>();
    for (const m of installed) {
      map.set(m.id, { id: m.id, name: m.name, installed: true });
    }
    for (const r of RECOMMENDED_OLLAMA_MODELS) {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          name: `${r.name} (pull: ollama pull ${r.id})`,
          installed: false,
        });
      }
    }
    return [...map.values()].sort((a, b) => {
      if (a.installed !== b.installed) return a.installed ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  let ollamaMenuRows = $derived(buildOllamaMenuRows($settings.ollamaModels));

  /** User-selected `num_ctx` cap (saved row, else recommended defaults). */
  function effectiveOllamaContextWindow(selectedId: string, models: ModelConfig[]): number {
    const row = models.find((m) => m.id === selectedId);
    if (row) return row.contextWindow;
    const rec = RECOMMENDED_OLLAMA_MODELS.find((r) => r.id === selectedId);
    if (rec) return pickContextOption(rec.contextWindow, rec.contextLimitMax ?? rec.contextWindow);
    return 8192;
  }

  let maxContextTokens = $derived(() => {
    if ($settings.chatBackend === "llamacpp") {
      const m = $settings.llamacppModels.find((x) => x.id === $settings.selectedModel);
      return m?.contextWindow ?? 8192;
    }
    if ($settings.chatBackend === "ollama") {
      return effectiveOllamaContextWindow($settings.selectedModel, $settings.ollamaModels);
    }
    const all = [...AVAILABLE_MODELS, ...$settings.ollamaModels, ...RECOMMENDED_OLLAMA_MODELS];
    const m = all.find((x) => x.id === $settings.selectedModel);
    return m?.contextWindow ?? 128000;
  });

  let modelTriggerLabel = $derived(
    $settings.chatBackend === "ollama"
      ? ($settings.ollamaModels.find((x) => x.id === $settings.selectedModel)?.name ??
          $settings.selectedModel)
      : $settings.chatBackend === "llamacpp"
        ? ($settings.llamacppModels.find((x) => x.id === $settings.selectedModel)?.name ??
            $settings.selectedModel)
        : (AVAILABLE_MODELS.find((x) => x.id === $settings.selectedModel)?.name ?? "Anthropic")
  );

  let contextUsed = $derived(() => {
    const msgs = $activeSession?.messages ?? [];
    const extras: string[] = [];
    if (streamingContent) extras.push(streamingContent);
    if (streamingThinking) extras.push(streamingThinking);
    const d = inputValue.trim();
    if (d) extras.push(d);
    return estimateChatContextTokens(
      msgs.map((m) => ({ role: m.role, content: m.content })),
      extras.join("\n\n")
    );
  });

  let contextPct = $derived(() => {
    const max = maxContextTokens();
    return max > 0 ? Math.min(100, (contextUsed() / max) * 100) : 0;
  });

  function formatTok(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(Math.round(n));
  }

  async function refreshOllamaModelsFromHost() {
    try {
      const list = await fetchOllamaModelList(get(settings).ollamaEndpoint, get(settings).ollamaModels);
      settings.setOllamaModels(list);
    } catch (e) {
      console.warn("Could not list Ollama models:", e);
    }
  }

  onMount(async () => {
    void refreshOllamaModelsFromHost();
    if (!isTauriAvailable()) return;
    unlisten = await listenHarnessEvents(handleHarnessEvent);
  });

  onDestroy(() => {
    if (unlisten) unlisten();
  });

  function markFirstStreamToken() {
    if (!streamFirstTokenAt) streamFirstTokenAt = performance.now();
  }

  function handleHarnessEvent(event: HarnessEvent) {
    const { event: eventType, data } = event;

    if (eventType === "ready") {
      return;
    }

    if (eventType === "started") {
      const d = data as { piPackageVersion?: string };
      if (d.piPackageVersion) {
        settings.setLastBundledPiSdkVersion(d.piPackageVersion);
      }
      return;
    }

    if (eventType === "usage") {
      const u = data as { inputTokens?: number; outputTokens?: number };
      const outTok = u.outputTokens ?? 0;
      const t0 = streamFirstTokenAt || streamWallStartMs;
      if (t0 > 0 && outTok > 0) {
        const elapsedSec = (performance.now() - t0) / 1000;
        if (elapsedSec > 0.05) {
          lastTokPerSec = outTok / elapsedSec;
        }
      }
      return;
    }

    if (eventType === "tool_decision" || eventType === "tool_start" || eventType === "tool_end") {
      pendingToolApproval = null;
    }

    if (eventType === "tool_approval_needed") {
      const d = data as { id?: string; tool?: string; input?: unknown };
      if (d.id && d.tool) {
        pendingToolApproval = { id: d.id, tool: d.tool, input: d.input };
      }
      return;
    }

    if (eventType === "stopped") {
      pendingToolApproval = null;
      streamingContent = "";
      streamingThinking = "";
      streamFirstTokenAt = 0;
      streamWallStartMs = 0;
      chat.setStreaming(false);
      return;
    }

    if (eventType === "thinking") {
      const act = reduceHarnessStreamDisplay(
        { streamingContent, streamingThinking },
        eventType,
        data
      );
      if (act.kind === "set-stream") {
        streamingThinking = act.view.streamingThinking;
        if (streamingThinking.length > 0) markFirstStreamToken();
      }
      return;
    }

    if (eventType === "error") {
      const act = reduceHarnessStreamDisplay(
        { streamingContent, streamingThinking },
        eventType,
        data
      );
      if (act.kind === "error-assistant") {
        pendingToolApproval = null;
        chat.addMessage({ role: "assistant", content: `Error: ${act.message}` });
        chat.setStreaming(false);
        streamingThinking = "";
        streamFirstTokenAt = 0;
        streamWallStartMs = 0;
      }
      return;
    }

    if (eventType === "message") {
      const act = reduceHarnessStreamDisplay(
        { streamingContent, streamingThinking },
        eventType,
        data
      );
      if (act.kind === "set-stream") {
        streamingContent = act.view.streamingContent;
        if (streamingContent.length > 0) markFirstStreamToken();
      } else if (act.kind === "commit-assistant") {
        streamingContent = act.view.streamingContent;
        streamingThinking = act.view.streamingThinking;
        chat.addMessage({
          role: "assistant",
          content: act.content,
          ...(act.thinking ? { thinking: act.thinking } : {}),
        });
        chat.setStreaming(false);
        streamFirstTokenAt = 0;
        streamWallStartMs = 0;
      }
    }

    if (eventType === "tool_start") {
      const toolData = data as { id: string; tool: string; input: unknown };
      chat.setToolCall({
        id: toolData.id,
        tool: toolData.tool,
        input: toolData.input,
        status: "running",
      });
    }

    if (eventType === "tool_end") {
      chat.setToolCall(null);
    }
  }

  async function ensureSidecarAndConfigure(): Promise<void> {
    try {
      if (!sidecarSpawned) {
        await startHarness();
        sidecarSpawned = true;
      }
      const provider =
        $settings.chatBackend === "ollama"
          ? "ollama"
          : $settings.chatBackend === "llamacpp"
            ? "llamacpp"
            : "anthropic";
      await sendToHarness("start", {
        harnessKind: $settings.harnessKind,
        model: $settings.selectedModel,
        provider,
        apiKey: provider === "anthropic" ? $settings.apiKeys.anthropic : undefined,
        anthropicExtendedThinking: $settings.anthropicExtendedThinking,
        ollamaEndpoint: $settings.ollamaEndpoint,
        ollamaNumCtx:
          provider === "ollama"
            ? effectiveOllamaContextWindow($settings.selectedModel, $settings.ollamaModels)
            : undefined,
        llamacppEndpoint: $settings.llamacppEndpoint,
        llamacppApiKey: $settings.llamacppApiKey,
        workspacePath: $files.workspacePath ?? "/",
        toolPolicy: {
          mode: $toolPolicyStore.mode,
          whitelist: $toolPolicyStore.whitelist,
        },
      });
    } catch (e) {
      console.error("Failed to configure harness:", e);
      chat.addMessage({
        role: "assistant",
        content: `Failed to configure harness: ${e}`,
      });
      throw e;
    }
  }

  async function submitToolDecision(approved: boolean) {
    const p = pendingToolApproval;
    if (!p) return;
    pendingToolApproval = null;
    try {
      await sendToHarness("approve_tool", { callId: p.id, approved });
    } catch (e) {
      console.error(e);
    }
  }

  function pickOllamaModel(modelId: string) {
    settings.setChatBackend("ollama");
    settings.setSelectedModel(modelId);
    modelMenuOpen = false;
  }

  function toggleModelMenu() {
    modelMenuOpen = !modelMenuOpen;
  }

  function onDocPointerDown(e: PointerEvent) {
    if (!modelMenuOpen || !modelMenuEl) return;
    const t = e.target as Node;
    if (!modelMenuEl.contains(t)) modelMenuOpen = false;
  }

  async function cancelChatRequest() {
    if (!isTauriAvailable() || !$chat.isStreaming) return;
    pendingToolApproval = null;
    streamingContent = "";
    streamingThinking = "";
    streamFirstTokenAt = 0;
    streamWallStartMs = 0;
    chat.setStreaming(false);
    try {
      await sendToHarness("stop", {});
    } catch (e) {
      console.error("Cancel failed:", e);
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!inputValue.trim() || $chat.isStreaming) return;

    chat.ensureActiveSession();

    const message = inputValue.trim();
    inputValue = "";

    chat.addMessage({ role: "user", content: message });

    if (!isTauriAvailable()) {
      chat.addMessage({
        role: "assistant",
        content: "Run with `npm run tauri dev` to enable chat.",
      });
      return;
    }

    const history = ($activeSession?.messages ?? [])
      .slice(0, -1)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    streamingThinking = "";
    streamWallStartMs = performance.now();
    streamFirstTokenAt = 0;
    chat.setStreaming(true);

    try {
      await ensureSidecarAndConfigure();
      await sendToHarness("chat", { message, history });
    } catch (e) {
      console.error("Failed to send message:", e);
      chat.addMessage({
        role: "assistant",
        content: `Failed to send message: ${e}`,
      });
      chat.setStreaming(false);
      streamingThinking = "";
      streamFirstTokenAt = 0;
      streamWallStartMs = 0;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  function newChat() {
    chat.newSession();
    if (isTauriAvailable()) {
      sendToHarness("clear", {}).catch(() => {});
    }
  }

  $effect(() => {
    if (
      messagesContainer &&
      ($activeSession?.messages.length || streamingContent || streamingThinking)
    ) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  $effect(() => {
    void streamingThinking;
    queueMicrotask(() => {
      if (thinkingPanelEl) {
        thinkingPanelEl.scrollTop = thinkingPanelEl.scrollHeight;
      }
    });
  });

  $effect(() => {
    if (tabScroll && $chat.activeSessionId) {
      const el = tabScroll.querySelector(`[data-session="${$chat.activeSessionId}"]`);
      el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
</script>

<svelte:window onpointerdown={onDocPointerDown} />

<div class="chat-pane">
  {#if pendingToolApproval}
    <div class="approval-banner" role="alert">
      <div class="approval-text">
        <strong>{pendingToolApproval.tool}</strong>
        <span class="approval-sub">Allow this tool for the current request?</span>
      </div>
      <div class="approval-actions">
        <button type="button" class="btn deny" onclick={() => submitToolDecision(false)}>Deny</button>
        <button type="button" class="btn allow" onclick={() => submitToolDecision(true)}>Allow</button>
      </div>
    </div>
  {/if}

  <div class="chat-toolbar">
    <div class="tabs-scroll" bind:this={tabScroll}>
      {#each $chat.sessions as session (session.id)}
        <div
          class="chat-tab-wrap"
          class:active={session.id === $chat.activeSessionId}
          data-session={session.id}
        >
          <button
            type="button"
            class="chat-tab"
            onclick={() => chat.setActiveSession(session.id)}
            title={session.title}
          >
            <span class="tab-title">{session.title}</span>
          </button>
          <button
            type="button"
            class="tab-close"
            title="Close chat (moves to history)"
            aria-label="Close chat"
            onclick={(ev) => {
              ev.stopPropagation();
              chat.closeSession(session.id);
            }}
          >
            ×
          </button>
        </div>
      {/each}
    </div>
    <button type="button" class="new-chat-btn" onclick={newChat} title="New chat">+</button>
  </div>

  <div class="messages" bind:this={messagesContainer}>
    {#if ($activeSession?.messages.length ?? 0) === 0 && !$chat.isStreaming}
      <div class="empty-state">
        <div class="history-preview">
          <div class="history-preview-title">Browse chat history</div>
          {#if $recentClosedChats.length > 0}
            <ul class="history-preview-list">
              {#each $recentClosedChats as h (h.id)}
                <li>
                  <button
                    type="button"
                    class="history-preview-item"
                    onclick={() => chat.reopenFromHistory(h.id)}
                  >
                    {h.title}
                  </button>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="history-empty-hint">No closed chats yet — close a tab with × to save it here</p>
          {/if}
        </div>
        {#if $activeSession}
          <p class="start-hint">Start a conversation</p>
          <p class="hint">Ask me to help with your code</p>
        {:else}
          <p class="start-hint">No open chat</p>
          <p class="hint">Use + for a new tab or reopen a chat above</p>
        {/if}
      </div>
    {:else}
      {#each $activeSession?.messages ?? [] as message (message.id)}
        <div class="message {message.role}">
          <div class="message-header">
            <span class="role">{message.role === "user" ? "You" : "Assistant"}</span>
          </div>
          {#if message.role === "assistant" && message.thinking}
            <details class="thinking-archive">
              <summary class="thinking-archive-summary">Thinking</summary>
              <pre class="thinking-archive-body">{message.thinking}</pre>
            </details>
          {/if}
          <div class="message-content">
            {message.content}
          </div>
          {#if message.toolCalls}
            {#each message.toolCalls as toolCall}
              <div class="tool-call {toolCall.status}">
                <span class="tool-name">{toolCall.tool}</span>
                <span class="tool-status">{toolCall.status}</span>
              </div>
            {/each}
          {/if}
        </div>
      {/each}
    {/if}

    {#if $chat.isStreaming}
      {#if streamingThinking}
        <div class="thinking-live" aria-label="Model thinking stream">
          <div class="thinking-live-head">Thinking</div>
          <div class="thinking-live-body" bind:this={thinkingPanelEl}>
            {streamingThinking}
          </div>
        </div>
      {/if}
      {#if streamingContent}
        <div class="message assistant streaming">
          <div class="message-header">
            <span class="role">Assistant</span>
          </div>
          <div class="message-content">
            {streamingContent}
          </div>
        </div>
      {/if}
      {#if !streamingContent}
        <div class="streaming-indicator">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      {/if}
    {/if}
  </div>

  <form class="input-area" onsubmit={handleSubmit}>
    <textarea
      bind:value={inputValue}
      placeholder="Ask a question or describe a task..."
      rows="3"
      onkeydown={handleKeydown}
    ></textarea>
    <div class="input-actions">
      <div class="model-picker" bind:this={modelMenuEl}>
        <button
          type="button"
          class="model-trigger"
          onclick={toggleModelMenu}
          aria-expanded={modelMenuOpen}
          aria-haspopup="listbox"
          title="Ollama models (switches chat to local Ollama)"
        >
          <span class="model-trigger-label">{modelTriggerLabel}</span>
          <span class="model-trigger-chev" aria-hidden="true">▾</span>
        </button>
        {#if lastTokPerSec != null && lastTokPerSec > 0}
          <span
            class="tok-rate"
            title="Average output tokens/sec for the last completed reply (from provider usage)"
          >
            {lastTokPerSec >= 100
              ? Math.round(lastTokPerSec)
              : lastTokPerSec >= 10
                ? lastTokPerSec.toFixed(1)
                : lastTokPerSec.toFixed(2)} tok/s
          </span>
        {/if}
        {#if modelMenuOpen}
          <div class="model-menu" role="listbox" aria-label="Ollama models">
            <div class="model-menu-head">
              <span>Ollama on {get(settings).ollamaEndpoint}</span>
              <button type="button" class="linkish" onclick={() => refreshOllamaModelsFromHost()}>
                Refresh
              </button>
            </div>
            {#each ollamaMenuRows as row (row.id)}
              <button
                type="button"
                role="option"
                aria-selected={$settings.chatBackend === "ollama" && $settings.selectedModel === row.id}
                class="model-option"
                class:current={$settings.chatBackend === "ollama" && $settings.selectedModel === row.id}
                class:not-installed={!row.installed}
                onclick={() => pickOllamaModel(row.id)}
              >
                <span class="opt-name">{row.name}</span>
                {#if row.installed}
                  <span class="opt-badge">installed</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <button
        type="button"
        class="cancel-btn"
        disabled={!$chat.isStreaming}
        onclick={() => void cancelChatRequest()}
        title="Stop the current reply"
      >
        Cancel
      </button>
      <button type="submit" class="send-btn" disabled={!inputValue.trim() || $chat.isStreaming}>
        Send
      </button>
    </div>
  </form>

  <div class="context-footer" aria-label="Estimated context from this chat">
    <div class="context-bar">
      <div class="context-fill" style="width: {contextPct()}%"></div>
    </div>
    <div class="context-meta">
      <span class="context-label">Context (this chat)</span>
      <span class="context-numbers">
        ~{formatTok(contextUsed())} / {formatTok(maxContextTokens())} tok
      </span>
    </div>
  </div>
</div>

<style>
  .chat-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .approval-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    background: #3a2f1a;
    border-bottom: 1px solid #8b6914;
    flex-shrink: 0;
  }

  .approval-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #e0e0e0;
    min-width: 0;
  }

  .approval-sub {
    color: #b0b0b0;
    font-weight: 400;
  }

  .approval-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .approval-actions .btn {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .approval-actions .btn.allow {
    background: #0e639c;
    color: #fff;
  }

  .approval-actions .btn.deny {
    background: #3c3c3c;
    color: #ddd;
    border-color: #555;
  }

  .chat-toolbar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    padding: 8px 8px 6px;
    border-bottom: 1px solid #3c3c3c;
    flex-shrink: 0;
    background: #252526;
  }

  .tabs-scroll {
    flex: 1;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    min-width: 0;
    scrollbar-width: thin;
  }

  .chat-tab-wrap {
    flex: 0 0 auto;
    max-width: 152px;
    display: flex;
    align-items: stretch;
    border: 1px solid transparent;
    border-radius: 6px;
    background: #2d2d30;
    overflow: hidden;
  }

  .chat-tab-wrap:hover {
    background: #363636;
  }

  .chat-tab-wrap.active {
    background: #1e1e1e;
    border-color: #007acc;
  }

  .chat-tab {
    flex: 1;
    min-width: 0;
    padding: 6px 4px 6px 10px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #a0a0a0;
    font-size: 12px;
    cursor: pointer;
    text-align: left;
  }

  .chat-tab-wrap:hover .chat-tab,
  .chat-tab-wrap.active .chat-tab {
    color: #d4d4d4;
  }

  .chat-tab-wrap.active .chat-tab {
    color: #e8e8e8;
  }

  .tab-close {
    flex-shrink: 0;
    width: 26px;
    border: none;
    background: transparent;
    color: #808080;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s ease, color 0.12s ease;
    padding: 0;
  }

  .chat-tab-wrap:hover .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    color: #f48771;
  }

  .tab-title {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .new-chat-btn {
    flex-shrink: 0;
    width: 32px;
    border: 1px dashed #555;
    border-radius: 6px;
    background: transparent;
    color: #888;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }

  .new-chat-btn:hover {
    color: #d4d4d4;
    border-color: #007acc;
    background: #2a2d2e;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    min-height: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    height: 100%;
    min-height: 120px;
    color: #808080;
    text-align: center;
    gap: 16px;
    max-width: 280px;
    margin: 0 auto;
  }

  .history-preview {
    text-align: left;
    border: 1px solid #3c3c3c;
    border-radius: 8px;
    padding: 12px 12px 10px;
    background: #2d2d30;
  }

  .history-preview-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #c0c0c0;
    margin-bottom: 8px;
  }

  .history-preview-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .history-preview-item {
    width: 100%;
    text-align: left;
    padding: 6px 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #3794ff;
    font-size: 13px;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-preview-item:hover {
    background: #37373d;
    color: #4aa3ff;
  }

  .history-empty-hint {
    font-size: 12px;
    color: #6a6a6a;
    line-height: 1.4;
    margin: 0;
  }

  .start-hint {
    font-size: 14px;
    color: #a0a0a0;
    margin: 0;
  }

  .empty-state .hint {
    font-size: 12px;
    margin: 0;
    color: #707070;
  }

  .message {
    margin-bottom: 16px;
    padding: 12px;
    border-radius: 8px;
  }

  .message.user {
    background: #2d2d30;
  }

  .message.assistant {
    background: #1e3a5f;
  }

  .message.assistant.streaming {
    border-left: 2px solid #007acc;
  }

  .message-header {
    margin-bottom: 8px;
  }

  .role {
    font-size: 12px;
    font-weight: 600;
    color: #808080;
    text-transform: uppercase;
  }

  .message-content {
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .tool-call {
    margin-top: 8px;
    padding: 8px;
    background: #252526;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }

  .tool-name {
    font-family: monospace;
    color: #4ec9b0;
  }

  .tool-status {
    color: #808080;
  }

  .thinking-live {
    margin: 0 8px 8px;
    border: 1px solid #3c3c3c;
    border-radius: 6px;
    background: #1a1a1b;
    overflow: hidden;
    max-width: 100%;
  }

  .thinking-live-head {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #858585;
    padding: 5px 8px;
    border-bottom: 1px solid #2d2d30;
    background: #252526;
  }

  .thinking-live-body {
    max-height: 120px;
    overflow-y: auto;
    padding: 8px 10px;
    font-size: 11px;
    line-height: 1.45;
    color: #9d9d9d;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }

  .thinking-archive {
    margin: 4px 0 8px;
    border-radius: 4px;
    border: 1px solid #3c3c3c;
    background: #1e1e1e;
    font-size: 12px;
  }

  .thinking-archive-summary {
    cursor: pointer;
    padding: 6px 10px;
    color: #858585;
    font-weight: 500;
    list-style: none;
  }

  .thinking-archive-summary::-webkit-details-marker {
    display: none;
  }

  .thinking-archive-body {
    margin: 0;
    padding: 0 10px 10px;
    max-height: 160px;
    overflow-y: auto;
    font-size: 11px;
    line-height: 1.45;
    color: #a0a0a0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }

  .streaming-indicator {
    display: flex;
    gap: 4px;
    padding: 12px;
  }

  .dot {
    width: 8px;
    height: 8px;
    background: #007acc;
    border-radius: 50%;
    animation: pulse 1.4s infinite ease-in-out;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes pulse {
    0%,
    80%,
    100% {
      opacity: 0.3;
    }
    40% {
      opacity: 1;
    }
  }

  .input-area {
    padding: 12px;
    border-top: 1px solid #3c3c3c;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    position: relative;
  }

  .input-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
  }

  .model-picker {
    position: relative;
    margin-right: auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tok-rate {
    font-size: 11px;
    color: #858585;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .model-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: min(220px, 46vw);
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #4c4c4c;
    background: #2d2d30;
    color: #c8c8c8;
    font-size: 12px;
    cursor: pointer;
  }

  .model-trigger:hover {
    border-color: #007acc;
    color: #e8e8e8;
  }

  .model-trigger-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .model-trigger-chev {
    flex-shrink: 0;
    font-size: 10px;
    opacity: 0.7;
  }

  .model-menu {
    position: absolute;
    z-index: 50;
    left: 0;
    bottom: calc(100% + 6px);
    min-width: min(320px, 85vw);
    max-height: 240px;
    overflow-y: auto;
    background: #252526;
    border: 1px solid #3c3c3c;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    padding: 6px 0;
  }

  .model-menu-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 10px 8px;
    font-size: 10px;
    color: #888;
    border-bottom: 1px solid #333;
    margin-bottom: 4px;
  }

  .linkish {
    border: none;
    background: none;
    color: #3794ff;
    font-size: 11px;
    cursor: pointer;
    padding: 0;
  }

  .linkish:hover {
    text-decoration: underline;
  }

  .model-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: #d4d4d4;
    font-size: 12px;
    cursor: pointer;
  }

  .model-option:hover {
    background: #2a2d2e;
  }

  .model-option.current {
    background: #1a3a52;
  }

  .model-option.not-installed {
    color: #a0a0a0;
  }

  .opt-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .opt-badge {
    flex-shrink: 0;
    font-size: 10px;
    color: #6a9955;
    text-transform: uppercase;
  }

  textarea {
    background: #3c3c3c;
    border: 1px solid #4c4c4c;
    border-radius: 6px;
    color: #d4d4d4;
    padding: 10px;
    font-family: inherit;
    font-size: 14px;
    resize: none;
  }

  textarea:focus {
    outline: none;
    border-color: #007acc;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid #555;
    color: #cccccc;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    flex-shrink: 0;
  }

  .cancel-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .cancel-btn:not(:disabled):hover {
    border-color: #888;
    background: #2a2d2e;
  }

  .send-btn {
    background: #007acc;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    flex-shrink: 0;
  }

  .send-btn:disabled {
    background: #3c3c3c;
    color: #808080;
    cursor: not-allowed;
  }

  .send-btn:not(:disabled):hover {
    background: #0098ff;
  }

  .context-footer {
    flex-shrink: 0;
    padding: 10px 12px 12px;
    border-top: 1px solid #3c3c3c;
    background: #252526;
  }

  .context-bar {
    height: 4px;
    background: #3c3c3c;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 6px;
  }

  .context-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ec9b0, #569cd6);
    max-width: 100%;
    transition: width 0.2s ease;
  }

  .context-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    font-size: 11px;
    color: #a0a0a0;
  }

  .context-label {
    font-weight: 500;
    color: #c0c0c0;
  }

  .context-numbers {
    font-family: ui-monospace, monospace;
    color: #8fc4e8;
    flex-shrink: 0;
  }
</style>
