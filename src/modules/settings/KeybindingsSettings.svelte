<script lang="ts">
  import { SHORTCUT_DEFAULTS } from "../shortcuts/defaults";
</script>

<div class="stack">
  <p class="note muted">
    Built-in shortcuts. <kbd class="inline-code">Mod</kbd> is Ctrl on Linux/Windows and ⌘ on macOS.
  </p>
  <table class="kbd-table">
    <thead>
      <tr><th>Action</th><th>Chord</th><th>Category</th></tr>
    </thead>
    <tbody>
      {#each SHORTCUT_DEFAULTS as row}
        <tr>
          <td>{row.description}</td>
          <td><code class="inline-code">{row.keys}</code></td>
          <td>{row.category}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .note {
    font-size: 12px;
    line-height: 1.45;
    color: #737373;
    margin: 0;
  }

  .note.muted {
    color: #5c5c5c;
  }

  .inline-code {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    padding: 1px 5px;
    border-radius: 4px;
    background: #1c1c1c;
    color: #c5c5c5;
  }

  .kbd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .kbd-table th,
  .kbd-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #333;
    text-align: left;
    vertical-align: top;
  }

  .kbd-table th {
    color: #b8b8b8;
    font-weight: 600;
  }
</style>
