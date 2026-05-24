<script lang="ts">
  import FileTree from "./FileTree.svelte";
  import GitPanel from "./GitPanel.svelte";
  import PromptPanel from "./PromptPanel.svelte";
  import FilesIcon from "phosphor-svelte/lib/FilesIcon";
  import GitDiffIcon from "phosphor-svelte/lib/GitDiffIcon";
  import FileMdIcon from "phosphor-svelte/lib/FileMdIcon";
  import FolderOpenIcon from "phosphor-svelte/lib/FolderOpenIcon";
  import GearIcon from "phosphor-svelte/lib/GearIcon";

  type Tab = "files" | "git" | "prompt";
  let activeTab = $state<Tab>("files");

  let {
    dockedOnly = false,
    onRequestExpand,
    onOpenWorkspace,
    onOpenSettings,
    /** Synced to shell so the aside width matches the activity strip when the tree/search pane is closed. */
    secondaryOpen = $bindable(true),
  } = $props<{
    dockedOnly?: boolean;
    onRequestExpand?: () => void;
    onOpenWorkspace?: () => void;
    onOpenSettings?: () => void;
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
    <div class="sidebar-icons__main">
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
            <FilesIcon class="acc-icon" size={20} aria-hidden="true" />
          {:else if tab.id === "git"}
            <GitDiffIcon class="acc-icon" size={20} aria-hidden="true" />
          {:else if tab.id === "prompt"}
            <FileMdIcon class="acc-icon" size={20} aria-hidden="true" />
          {/if}
        </button>
      {/each}
    </div>
    <div class="sidebar-icons__footer" role="group" aria-label="Workspace and settings">
      <button
        type="button"
        class="icon-btn"
        title="Open workspace folder (explorer + new terminals)"
        onclick={() => onOpenWorkspace?.()}
      >
        <FolderOpenIcon class="acc-icon" size={20} aria-hidden="true" />
      </button>
      <button type="button" class="icon-btn" title="Settings" onclick={() => onOpenSettings?.()}>
        <GearIcon class="acc-icon" size={20} aria-hidden="true" />
      </button>
    </div>
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
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
    background: var(--activity-bar-bg);
    border-left: 1px solid var(--activity-bar-border);
  }

  .sidebar-icons__main {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-icons__footer {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    margin-top: auto;
    border-top: 1px solid var(--activity-bar-border);
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
