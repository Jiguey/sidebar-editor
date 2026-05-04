<script lang="ts">
  import { onMount } from "svelte";
  import { files, type FileEntry } from "../stores/files";
  import { listDir, readFile, getWorkspacePath, getLanguageFromPath, isTauriAvailable } from "../ipc";

  let loading = $state(true);
  let error = $state<string | null>(null);
  let browserMode = $state(false);

  onMount(async () => {
    if (!isTauriAvailable()) {
      browserMode = true;
      loading = false;
      return;
    }

    try {
      const workspace = await getWorkspacePath();
      files.setWorkspacePath(workspace);
      const tree = await listDir(workspace);
      files.setTree(tree);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  });

  async function handleToggle(entry: FileEntry) {
    if (!entry.is_dir) return;

    if (entry.expanded && entry.children) {
      files.toggleExpanded(entry.path);
    } else {
      try {
        const children = await listDir(entry.path);
        files.setChildren(entry.path, children);
      } catch (e) {
        console.error("Failed to list directory:", e);
      }
    }
  }

  async function handleFileClick(entry: FileEntry) {
    if (entry.is_dir) {
      handleToggle(entry);
      return;
    }

    try {
      const content = await readFile(entry.path);
      files.openFile({
        path: entry.path,
        name: entry.name,
        content,
        isDirty: false,
        language: getLanguageFromPath(entry.path),
      });
    } catch (e) {
      console.error("Failed to read file:", e);
    }
  }

  /** VS Code / Cursor codicon names for the explorer tree. */
  function getCodicon(entry: FileEntry): string {
    if (entry.is_dir) {
      return entry.expanded ? "codicon-folder-opened" : "codicon-folder";
    }
    const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte", "html", "htm"].includes(ext)) {
      return "codicon-file-code";
    }
    if (ext === "json" || ext === "jsonc") return "codicon-json";
    if (ext === "md" || ext === "mdx") return "codicon-markdown";
    if (ext === "py") return "codicon-python";
    if (["css", "scss", "less"].includes(ext)) return "codicon-symbol-color";
    return "codicon-file";
  }
</script>

<div class="file-tree">
  {#if loading}
    <div class="loading">Loading files...</div>
  {:else if browserMode}
    <div class="browser-mode">
      <p>Browser Mode</p>
      <p class="hint">Run with <code>npm run tauri dev</code> to access files</p>
    </div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="tree-content">
      {#each $files.tree as entry (entry.path)}
        {@render treeNode(entry, 0)}
      {/each}
    </div>
  {/if}
</div>

{#snippet treeNode(entry: FileEntry, depth: number)}
  <div class="tree-item" style="padding-left: {depth * 16 + 8}px">
    <button
      class="tree-button"
      class:is-dir={entry.is_dir}
      onclick={() => handleFileClick(entry)}
    >
      <span class="codicon {getCodicon(entry)}" aria-hidden="true"></span>
      <span class="name">{entry.name}</span>
    </button>
  </div>
  {#if entry.is_dir && entry.expanded && entry.children}
    {#each entry.children as child (child.path)}
      {@render treeNode(child, depth + 1)}
    {/each}
  {/if}
{/snippet}

<style>
  .file-tree {
    width: 100%;
    background: #252526;
    overflow-y: auto;
    height: 100%;
  }

  .loading,
  .error {
    padding: 16px;
    color: #808080;
    font-size: 13px;
  }

  .error {
    color: #f14c4c;
  }

  .browser-mode {
    padding: 16px;
    text-align: center;
  }

  .browser-mode p {
    color: #808080;
    font-size: 13px;
    margin: 0;
  }

  .browser-mode .hint {
    margin-top: 8px;
    font-size: 11px;
  }

  .browser-mode code {
    background: #3c3c3c;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }

  .tree-content {
    padding: 8px 0;
  }

  .tree-item {
    display: flex;
  }

  .tree-button {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 2px 8px;
    background: transparent;
    border: none;
    color: #cccccc;
    font-size: 13px;
    line-height: 22px;
    cursor: pointer;
    text-align: left;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe W365", "Segoe UI",
      sans-serif;
  }

  .tree-button:hover {
    background: #2a2d2e;
  }

  .tree-button.is-dir {
    color: #c5c5c5;
  }

  .tree-button :global(.codicon) {
    font-size: 16px;
    width: 18px;
    flex-shrink: 0;
    color: #c5c5c5;
  }

  .tree-button:not(.is-dir) :global(.codicon) {
    color: #a8ccf0;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
