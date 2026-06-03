<script lang="ts">
  import { workspaceReadOnly } from "$lib/workspace";
</script>

{#if $workspaceReadOnly}
  <div class="read-only-banner" role="status" aria-live="polite">
    <span class="icon" aria-hidden="true">⊘</span>
    Read-only — this folder is open in another window
  </div>
{/if}

<style>
  .read-only-banner {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 12px;
    background: rgba(201, 162, 39, 0.12);
    border-bottom: 1px solid rgba(201, 162, 39, 0.3);
    font-size: 11px;
    color: #d4a017;
    font-weight: 500;
  }

  .icon {
    font-size: 13px;
    line-height: 1;
  }
</style>
