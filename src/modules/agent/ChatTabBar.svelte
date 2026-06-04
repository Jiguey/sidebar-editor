<script lang="ts">
  import { chat } from "$lib/stores/chat";
  import { settings } from "$lib/stores/settings";
  import { tabStripScroll } from "$lib/actions/scrollOverflow";
  import AppIcon from "$lib/components/AppIcon.svelte";
  import ShellTabBubble from "../workbench/ShellTabBubble.svelte";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";

  let tabScroll: HTMLDivElement;

  let uniformTabWidth = $derived($settings.editor.uniformTabWidth);
  let uniformTabWidthPx = $derived($settings.editor.uniformTabWidthPx);

  function newChat() {
    chat.newSession();
  }

  $effect(() => {
    if (tabScroll && $chat.activeSessionId) {
      const el = tabScroll.querySelector(`[data-session="${$chat.activeSessionId}"]`);
      el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
</script>

<div class="chat-tab-bar-root">
  <div class="tab-strip-scroll-wrap">
    <div class="tabs-scroll" bind:this={tabScroll} use:tabStripScroll role="tablist" aria-label="Chat sessions">
      {#each $chat.sessions as session (session.id)}
        <div class="hdr-tab-slot" data-session={session.id}>
          <ShellTabBubble
            title={session.title}
            active={session.id === $chat.activeSessionId}
            uniformWidth={uniformTabWidth}
            uniformWidthPx={uniformTabWidthPx}
            allowMiddleClose
            onActivate={() => chat.setActiveSession(session.id)}
            onClose={() => chat.closeSession(session.id)}
          >
            {#snippet icon()}
              <AppIcon name="chat-lines" size={11} />
            {/snippet}
          </ShellTabBubble>
        </div>
      {/each}
    </div>
  </div>
  <button type="button" class="hdr-tab-aux-btn" onclick={newChat} title="New chat" aria-label="New chat">
    <PlusIcon size={14} />
  </button>
</div>

<style>
  .chat-tab-bar-root {
    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    min-width: 0;
    padding: 0 6px 0 0;
    border: none;
    outline: none;
    box-shadow: none;
  }

  .tabs-scroll {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    min-width: 0;
    padding-left: var(--workbench-tab-strip-inner-padding-left, 8px);
  }

  .hdr-tab-slot {
    flex: 0 0 auto;
  }

  .hdr-tab-aux-btn {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 9999px;
    background: var(--workbench-control-bg, var(--secondary));
    color: var(--muted-foreground);
    cursor: pointer;
  }

  .hdr-tab-aux-btn:hover {
    background: var(--workbench-control-active-bg, var(--muted));
    color: var(--foreground);
  }

  .hdr-tab-aux-btn :global(svg) {
    width: 12px;
    height: 12px;
  }

  .hdr-tab-aux-btn:focus-visible {
    outline: 1px solid var(--ring);
    outline-offset: 2px;
  }
</style>
