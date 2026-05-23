<script lang="ts">
  import FileTree from "./FileTree.svelte";
  import GitPanel from "./GitPanel.svelte";
  import PromptPanel from "./PromptPanel.svelte";
  import FolderTree from "@lucide/svelte/icons/folder-tree";
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import ScrollText from "@lucide/svelte/icons/scroll-text";

  type Tab = "files" | "git" | "prompt";
  let activeTab = $state<Tab>("files");

  let {
    dockedOnly = false,
    onRequestExpand,
    /** Synced to shell so the aside width matches the activity strip when the tree/search pane is closed. */
    secondaryOpen = $bindable(true),
  } = $props<{
    dockedOnly?: boolean;
    onRequestExpand?: () => void;
    secondaryOpen?: boolean;
  }>();

  const tabs: { id: Tab; title: string }[] = [
    { id: "files", title: "Explorer" },
    { id: "git", title: "Git" },
    { id: "prompt", title: "System Prompt" },
  ];

  function onIconClick(tab: Tab) {
    if (dockedOnly) {
      activeTab = tab;
      secondaryOpen = true;
      onRequestExpand?.();
      return;
    }
    if (activeTab === tab && secondaryOpen) {
      secondaryOpen = false;
      return;
    }
    activeTab = tab;
    secondaryOpen = true;
  }
</script>

<div class="right-sidebar" class:right-sidebar--dock={dockedOnly}>
  {#if secondaryOpen && !dockedOnly}
    <div class="sidebar-secondary">
      <div class="content-body">
        {#if activeTab === "files"}
          <FileTree />
        {:else if activeTab === "git"}
          <GitPanel />
        {:else if activeTab === "prompt"}
          <PromptPanel />
        {/if}
      </div>
    </div>
  {/if}

  <!-- Activity strip: always rendered; stays visible when the secondary pane is collapsed. -->
  <div class="sidebar-icons" role="toolbar" aria-label="Right activity bar">
    {#each tabs as tab}
      <button
        type="button"
        class="icon-btn"
        class:active={dockedOnly ? activeTab === tab.id : secondaryOpen && activeTab === tab.id}
        aria-pressed={dockedOnly ? activeTab === tab.id : secondaryOpen && activeTab === tab.id}
        onclick={() => onIconClick(tab.id)}
        title={tab.title}
      >
        {#if tab.id === "files"}
          <FolderTree class="acc-icon" aria-hidden="true" />
        {:else if tab.id === "git"}
          <GitBranch class="acc-icon" aria-hidden="true" />
        {:else if tab.id === "prompt"}
          <ScrollText class="acc-icon" aria-hidden="true" />
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .right-sidebar {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-height: 0;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    height: 100%;
    align-self: stretch;
    align-items: stretch;
  }

  .right-sidebar--dock {
    flex: 1 1 auto;
    min-height: 0;
  }

  .right-sidebar:not(:has(.sidebar-secondary)) .sidebar-icons {
    margin-left: auto;
  }

  .sidebar-secondary {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--sidebar);
    border-left: 1px solid transparent;
  }

  .sidebar-icons {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    flex-shrink: 0;
    align-self: stretch;
    width: 34px;
    min-width: 34px;
    max-width: 34px;
    box-sizing: border-box;
    background: var(--activity-bar-bg);
    border-left: 1px solid var(--activity-bar-border);
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--activity-bar-inactive);
    cursor: pointer;
  }

  .icon-btn:hover {
    color: var(--activity-bar-foreground);
    background: var(--activity-bar-hover-bg);
  }

  .icon-btn.active {
    color: var(--activity-bar-active);
    border-left: 2px solid var(--activity-bar-active-border);
  }

  .content-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global(.acc-icon) {
    width: 20px;
    height: 20px;
  }
</style>
