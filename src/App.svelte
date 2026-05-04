<script lang="ts">
  import ChatPane from "./lib/components/ChatPane.svelte";
  import FileTree from "./lib/components/FileTree.svelte";
  import Editor from "./lib/components/Editor.svelte";
  import SettingsPane from "./lib/components/SettingsPane.svelte";
  import StatusBar from "./lib/components/StatusBar.svelte";
  import Terminal from "./lib/components/Terminal.svelte";
  import RightSidebar from "./lib/components/RightSidebar.svelte";

  let settingsOpen = $state(false);
  
  // Panel visibility state
  let showLeftPanel = $state(true);
  let showRightPanel = $state(true);
  let showBottomPanel = $state(false);
</script>

<div class="app-container">
  <!-- Navbar -->
  <nav class="navbar">
    <div class="navbar-left">
      <span class="app-title">Tiny Llama</span>
    </div>
    <div class="navbar-right">
      <button
        class="panel-toggle"
        class:active={showLeftPanel}
        onclick={() => showLeftPanel = !showLeftPanel}
        title="Toggle left panel (Chat)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="5" height="12" rx="1" />
          <rect x="8" y="2" width="7" height="12" rx="1" opacity="0.3" />
        </svg>
      </button>
      <button
        class="panel-toggle"
        class:active={showBottomPanel}
        onclick={() => showBottomPanel = !showBottomPanel}
        title="Toggle bottom panel (Terminal)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="14" height="6" rx="1" opacity="0.3" />
          <rect x="1" y="10" width="14" height="4" rx="1" />
        </svg>
      </button>
      <button
        class="panel-toggle"
        class:active={showRightPanel}
        onclick={() => showRightPanel = !showRightPanel}
        title="Toggle right panel (Explorer)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="7" height="12" rx="1" opacity="0.3" />
          <rect x="10" y="2" width="5" height="12" rx="1" />
        </svg>
      </button>
      <div class="navbar-divider"></div>
      <button class="settings-btn" onclick={() => settingsOpen = true} title="Settings">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 10a2 2 0 100-4 2 2 0 000 4zm0 1a3 3 0 110-6 3 3 0 010 6z"/>
          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.86 2.929 2.929 0 010 5.858z"/>
        </svg>
      </button>
    </div>
  </nav>

  <!-- Main content area -->
  <div class="main-area">
    <!-- Left Panel (Chat) -->
    {#if showLeftPanel}
      <aside class="panel panel-left">
        <ChatPane />
      </aside>
      <div class="panel-resizer panel-resizer-left"></div>
    {/if}

    <!-- Center Area (Editor + Bottom) -->
    <div class="center-area">
      <div class="editor-area">
        <Editor />
      </div>
      
      {#if showBottomPanel}
        <div class="panel-resizer panel-resizer-bottom"></div>
        <aside class="panel panel-bottom">
          <Terminal />
        </aside>
      {/if}
    </div>

    <!-- Right Panel (Explorer) -->
    {#if showRightPanel}
      <div class="panel-resizer panel-resizer-right"></div>
      <aside class="panel panel-right">
        <RightSidebar />
      </aside>
    {/if}
  </div>

  <StatusBar />
</div>

<SettingsPane open={settingsOpen} onClose={() => settingsOpen = false} />

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    /* Cursor / VS Code–style UI stack (workbench, not editor monospace) */
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe W365", "Segoe UI",
      "Helvetica Neue", Helvetica, Arial, sans-serif;
    background: #1e1e1e;
    color: #d4d4d4;
    height: 100vh;
    overflow: hidden;
  }

  :global(#app) {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* Navbar */
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 38px;
    background: #323233;
    border-bottom: 1px solid #3c3c3c;
    padding: 0 12px;
    -webkit-app-region: drag;
  }

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-title {
    font-size: 13px;
    font-weight: 600;
    color: #d4d4d4;
  }

  .navbar-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    -webkit-app-region: no-drag;
  }

  .panel-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #808080;
    cursor: pointer;
  }

  .panel-toggle:hover {
    background: #3c3c3c;
    color: #d4d4d4;
  }

  .panel-toggle.active {
    color: #007acc;
  }

  .navbar-divider {
    width: 1px;
    height: 16px;
    background: #3c3c3c;
    margin: 0 8px;
  }

  .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #808080;
    cursor: pointer;
  }

  .settings-btn:hover {
    background: #3c3c3c;
    color: #d4d4d4;
  }

  /* Main area */
  .main-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Panels */
  .panel {
    background: #252526;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-left {
    width: 320px;
    min-width: 200px;
    border-right: 1px solid #3c3c3c;
  }

  .panel-right {
    flex: 0 0 auto;
    min-width: 48px;
    max-width: min(420px, 45vw);
    border-left: 1px solid #3c3c3c;
  }

  .panel-bottom {
    height: 200px;
    min-height: 100px;
    border-top: 1px solid #3c3c3c;
  }

  /* Panel resizers */
  .panel-resizer {
    background: transparent;
    flex-shrink: 0;
  }

  .panel-resizer-left,
  .panel-resizer-right {
    width: 4px;
    cursor: col-resize;
  }

  .panel-resizer-bottom {
    height: 4px;
    cursor: row-resize;
  }

  .panel-resizer:hover {
    background: #007acc;
  }

  /* Center area */
  .center-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #1e1e1e;
  }

  .editor-area {
    flex: 1;
    overflow: hidden;
  }
</style>
