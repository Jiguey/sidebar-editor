<script lang="ts">
  import { workbench } from "$lib/stores/workbench";
  import { files } from "$lib/stores/files";
  import { normalizeFilePath } from "$lib/fsPath";
  import ShellTabBubble from "./ShellTabBubble.svelte";
  import FileTextIcon from "phosphor-svelte/lib/FileTextIcon";
  import TerminalIcon from "phosphor-svelte/lib/TerminalIcon";
  import MonitorIcon from "phosphor-svelte/lib/MonitorIcon";
</script>

<div
  class="workbench-tablist flex h-full min-h-0 w-full min-w-0 shrink-0 items-center gap-1 overflow-x-auto py-0.5 pr-0.5 pl-0.5"
  role="tablist"
  aria-label="Workbench tabs"
>
  {#each $workbench.tabs as tab (tab.id)}
    {@const active = $workbench.activeTabId === tab.id}
    {@const dirty =
      tab.kind === "editor"
        ? ($files.openFiles.find((f) => normalizeFilePath(f.path) === normalizeFilePath(tab.path))?.isDirty ??
          false)
        : false}
    <div class="hdr-tab-slot">
      <ShellTabBubble
        title={tab.title}
        {active}
        {dirty}
        allowMiddleClose
        onActivate={() => workbench.setActiveTab(tab.id)}
        onClose={() => workbench.closeTab(tab.id)}
      >
        {#snippet icon()}
          {#if tab.kind === "editor"}
            <FileTextIcon size={14} />
          {:else if tab.kind === "terminal"}
            <TerminalIcon size={14} />
          {:else}
            <MonitorIcon size={14} />
          {/if}
        {/snippet}
      </ShellTabBubble>
    </div>
  {/each}
  {#if $workbench.tabs.length === 0}
    <span class="empty-hint"> Open a file from the explorer or start a terminal. </span>
  {/if}
</div>

<style>
  .workbench-tablist {
    box-sizing: border-box;
    border: none;
    outline: none;
    box-shadow: none;
  }

  .hdr-tab-slot {
    flex: 0 0 auto;
  }

  .empty-hint {
    padding: 0 6px;
    font-size: 10px;
    color: var(--muted-foreground);
    white-space: nowrap;
  }
</style>
