<script lang="ts">
  let terminalOutput = $state<string[]>([
    "Welcome to Tiny Llama Terminal",
    "$ ",
  ]);
  let inputValue = $state("");
  let terminalContainer: HTMLDivElement;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const command = inputValue.trim();
      if (command) {
        terminalOutput = [...terminalOutput.slice(0, -1), `$ ${command}`, ""];
        
        // TODO: Execute command via Tauri
        terminalOutput = [...terminalOutput, `Command execution not yet implemented: ${command}`, "$ "];
      }
      inputValue = "";
    }
  }

  $effect(() => {
    if (terminalContainer) {
      terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
  });
</script>

<div class="terminal">
  <div class="terminal-header">
    <span class="terminal-title">Terminal</span>
    <div class="terminal-actions">
      <button class="terminal-btn" title="New Terminal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <button class="terminal-btn" title="Clear">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="terminal-body" bind:this={terminalContainer}>
    {#each terminalOutput as line}
      <div class="terminal-line">{line}</div>
    {/each}
    <div class="terminal-input-line">
      <span class="prompt">$</span>
      <input
        type="text"
        bind:value={inputValue}
        onkeydown={handleKeydown}
        class="terminal-input"
        autofocus
      />
    </div>
  </div>
</div>

<style>
  .terminal {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
  }

  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
  }

  .terminal-title {
    font-size: 12px;
    color: #d4d4d4;
  }

  .terminal-actions {
    display: flex;
    gap: 4px;
  }

  .terminal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #808080;
    cursor: pointer;
  }

  .terminal-btn:hover {
    background: #3c3c3c;
    color: #d4d4d4;
  }

  .terminal-body {
    flex: 1;
    padding: 8px 12px;
    font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
    font-size: 13px;
    overflow-y: auto;
    color: #d4d4d4;
  }

  .terminal-line {
    white-space: pre-wrap;
    line-height: 1.4;
  }

  .terminal-input-line {
    display: flex;
    align-items: center;
  }

  .prompt {
    color: #89d185;
    margin-right: 8px;
  }

  .terminal-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #d4d4d4;
    font-family: inherit;
    font-size: inherit;
    outline: none;
  }
</style>
