<script lang="ts">
  import FileTree from "./FileTree.svelte";
  import SearchPanel from "./SearchPanel.svelte";
  import SourceControl from "./SourceControl.svelte";

  type Tab = "files" | "search" | "source-control";
  let activeTab = $state<Tab>("files");
  /** Secondary pane (Explorer / Search / Source Control) open to the left of the activity bar */
  let secondaryOpen = $state(false);

  const tabs: { id: Tab; codicon: string; title: string }[] = [
    { id: "files", codicon: "codicon-files", title: "Explorer" },
    { id: "search", codicon: "codicon-search", title: "Search" },
    { id: "source-control", codicon: "codicon-source-control", title: "Source Control" },
  ];

  function onIconClick(tab: Tab) {
    if (activeTab === tab && secondaryOpen) {
      secondaryOpen = false;
      return;
    }
    activeTab = tab;
    secondaryOpen = true;
  }
</script>

<div class="right-sidebar" class:collapsed={!secondaryOpen}>
  {#if secondaryOpen}
    <div class="sidebar-secondary">
      <div class="content-header">
        <span class="header-title">
          {#if activeTab === "files"}
            Explorer
          {:else if activeTab === "search"}
            Search
          {:else if activeTab === "source-control"}
            Source Control
          {/if}
        </span>
      </div>

      <div class="content-body">
        {#if activeTab === "files"}
          <FileTree />
        {:else if activeTab === "search"}
          <SearchPanel />
        {:else if activeTab === "source-control"}
          <SourceControl />
        {/if}
      </div>
    </div>
  {/if}

  <!-- Activity bar: always flush with the right edge of the window -->
  <div class="sidebar-icons" role="toolbar" aria-label="Right activity bar">
    {#each tabs as tab}
      <button
        type="button"
        class="icon-btn"
        class:active={secondaryOpen && activeTab === tab.id}
        aria-pressed={secondaryOpen && activeTab === tab.id}
        onclick={() => onIconClick(tab.id)}
        title={tab.title}
      >
        <span class="codicon {tab.codicon}" aria-hidden="true"></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .right-sidebar {
    display: flex;
    flex-direction: row;
    height: 100%;
    min-width: 0;
    width: 280px;
    max-width: min(400px, 42vw);
  }

  .right-sidebar.collapsed {
    width: 48px;
    max-width: 48px;
  }

  .sidebar-secondary {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #252526;
    border-left: 1px solid #3c3c3c;
  }

  .sidebar-icons {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 48px;
    background: #333333;
    padding: 8px 0;
    gap: 4px;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: transparent;
    border: none;
    color: #808080;
    cursor: pointer;
    position: relative;
  }

  .icon-btn:hover {
    color: #d4d4d4;
  }

  .icon-btn.active {
    color: #d4d4d4;
  }

  /* Accent on the inner edge (toward editor / secondary pane) */
  .icon-btn :global(.codicon) {
    font-size: 22px;
  }

  .icon-btn.active::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 24px;
    background: #007acc;
  }

  .content-header {
    padding: 10px 12px;
    border-bottom: 1px solid #3c3c3c;
  }

  .header-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: #bbbbbb;
    letter-spacing: 0.5px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe W365", "Segoe UI",
      sans-serif;
  }

  .content-body {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }

  .content-body :global(.file-tree) {
    width: 100%;
    border-right: none;
  }
</style>
