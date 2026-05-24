<script lang="ts">
  import type { FileEntry } from "$lib/stores/files";
  import { normalizeFilePath } from "$lib/fsPath";
  import FileTreeRow from "./FileTreeRow.svelte";
  import FileIcon from "$lib/components/FileIcon.svelte";

  interface Props {
    entry: FileEntry;
    depth: number;
    onActivate: (entry: FileEntry) => void | Promise<void>;
    highlightPath?: string | null;
    onContextMenu?: (entry: FileEntry, clientX: number, clientY: number) => void;
  }

  let { entry, depth, onActivate, highlightPath = null, onContextMenu }: Props = $props();

  const isHighlighted = $derived(
    highlightPath != null && normalizeFilePath(entry.path) === normalizeFilePath(highlightPath)
  );
</script>

<div class="tree-item" style="padding-left: {depth * 16 + 8}px">
  <button
    type="button"
    class="tree-button"
    class:is-dir={entry.is_dir}
    class:revealed={isHighlighted}
    onclick={() => void onActivate(entry)}
    oncontextmenu={(e) => {
      e.preventDefault();
      onContextMenu?.(entry, e.clientX, e.clientY);
    }}
  >
    <FileIcon name={entry.name} isDir={entry.is_dir} expanded={entry.expanded ?? false} />
    <span class="name">{entry.name}</span>
  </button>
</div>
{#if entry.is_dir && entry.expanded && entry.children}
  {#each entry.children as child (child.path)}
    <FileTreeRow
      entry={child}
      depth={depth + 1}
      {onActivate}
      {highlightPath}
      {onContextMenu}
    />
  {/each}
{/if}

<style>
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
    color: var(--sidebar-foreground);
    font-size: 13px;
    line-height: 22px;
    cursor: pointer;
    text-align: left;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .tree-button:hover {
    background: var(--sidebar-accent);
  }

  .tree-button.revealed {
    outline: 1px solid color-mix(in srgb, var(--sidebar-primary) 55%, transparent);
    background: color-mix(in srgb, var(--sidebar-primary) 12%, transparent);
  }

  .tree-button.is-dir {
    color: var(--muted-foreground);
  }

  .tree-button :global(.codicon),
  .tree-button :global(.file-icon-img) {
    font-size: 16px;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--muted-foreground);
  }

  .tree-button:not(.is-dir) :global(.codicon) {
    color: var(--sidebar-primary);
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
