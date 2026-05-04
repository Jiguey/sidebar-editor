<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { files, activeFile } from "../stores/files";
  import { writeFile } from "../ipc";

  let editorContainer: HTMLDivElement;
  let editorView: any = null;

  // CodeMirror imports (loaded dynamically)
  let EditorState: any;
  let EditorView: any;
  let basicSetup: any;
  let languageExtensions: Record<string, any> = {};

  onMount(async () => {
    // Dynamic import of CodeMirror modules
    const [stateModule, viewModule, setupModule, jsModule, tsModule, htmlModule, cssModule, jsonModule, mdModule, rustModule, pythonModule] = await Promise.all([
      import("@codemirror/state"),
      import("@codemirror/view"),
      import("codemirror"),
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-html"),
      import("@codemirror/lang-css"),
      import("@codemirror/lang-json"),
      import("@codemirror/lang-markdown"),
      import("@codemirror/lang-rust"),
      import("@codemirror/lang-python"),
    ]);

    EditorState = stateModule.EditorState;
    EditorView = viewModule.EditorView;
    basicSetup = setupModule.basicSetup;

    languageExtensions = {
      javascript: jsModule.javascript(),
      typescript: tsModule.javascript({ typescript: true }),
      html: htmlModule.html(),
      css: cssModule.css(),
      json: jsonModule.json(),
      markdown: mdModule.markdown(),
      rust: rustModule.rust(),
      python: pythonModule.python(),
    };
  });

  $effect(() => {
    const file = $activeFile;
    if (!EditorView || !editorContainer) return;

    // Cleanup previous editor
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }

    if (!file) return;

    const langExt = languageExtensions[file.language] ?? [];

    const updateListener = EditorView.updateListener.of((update: any) => {
      if (update.docChanged) {
        const content = update.state.doc.toString();
        files.updateFileContent(file.path, content);
      }
    });

    const theme = EditorView.theme({
      "&": {
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        height: "100%",
      },
      ".cm-content": {
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "14px",
      },
      ".cm-gutters": {
        backgroundColor: "#1e1e1e",
        color: "#858585",
        border: "none",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "#2a2d2e",
      },
      ".cm-activeLine": {
        backgroundColor: "#2a2d2e",
      },
      ".cm-selectionBackground": {
        backgroundColor: "#264f78 !important",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: "#d4d4d4",
      },
    }, { dark: true });

    editorView = new EditorView({
      state: EditorState.create({
        doc: file.content,
        extensions: [basicSetup, langExt, updateListener, theme],
      }),
      parent: editorContainer,
    });
  });

  async function handleSave() {
    const file = $activeFile;
    if (!file || !editorView) return;

    try {
      const content = editorView.state.doc.toString();
      await writeFile(file.path, content);
      files.markSaved(file.path);
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  }

  onDestroy(() => {
    if (editorView) {
      editorView.destroy();
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="editor-pane">
  {#if $files.openFiles.length > 0}
    <div class="tabs">
      {#each $files.openFiles as file (file.path)}
        <div
          class="tab"
          class:active={file.path === $files.activeFilePath}
          role="tab"
          tabindex="0"
          onclick={() => files.setActiveFile(file.path)}
          onkeydown={(e) => e.key === 'Enter' && files.setActiveFile(file.path)}
        >
          <span class="tab-name">{file.name}</span>
          {#if file.isDirty}
            <span class="dirty-indicator">●</span>
          {/if}
          <button
            class="close-btn"
            onclick={(e) => {
              e.stopPropagation();
              files.closeFile(file.path);
            }}
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  {/if}
  <div class="editor-container" bind:this={editorContainer}></div>
  {#if $files.openFiles.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <p>No file open</p>
      <p class="hint">Select a file from the explorer to edit</p>
    </div>
  {/if}
</div>

<style>
  .editor-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    background: #1e1e1e;
  }

  .tabs {
    display: flex;
    background: #252526;
    border-bottom: 1px solid #3c3c3c;
    overflow-x: auto;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #2d2d30;
    border-right: 1px solid #3c3c3c;
    color: #808080;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
  }

  .tab:hover {
    background: #323235;
  }

  .tab.active {
    background: #1e1e1e;
    color: #d4d4d4;
    border-bottom: 2px solid #007acc;
  }

  .dirty-indicator {
    color: #d4d4d4;
    font-size: 10px;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #808080;
    font-size: 16px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }

  .close-btn:hover {
    color: #d4d4d4;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .editor-container :global(.cm-scroller) {
    overflow: auto;
  }

  .empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #808080;
    text-align: center;
    pointer-events: none;
  }

  .empty-icon {
    margin-bottom: 16px;
    opacity: 0.3;
  }

  .empty-state p {
    font-size: 14px;
  }

  .empty-state .hint {
    font-size: 12px;
    margin-top: 8px;
  }
</style>
