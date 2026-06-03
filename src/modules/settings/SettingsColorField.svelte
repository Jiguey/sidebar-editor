<script lang="ts">
  /** One labelled color row: name left, swatch + hex value right, all on one line. */
  interface Props {
    label: string;
    hint: string;
    value: string;
    onChange: (value: string) => void;
  }

  let { label, hint, value, onChange }: Props = $props();

  const emit = (e: Event) => onChange((e.currentTarget as HTMLInputElement).value);
</script>

<label class="color-row" title={hint}>
  <span class="color-name">{label}</span>
  <div class="color-controls">
    <input type="color" class="color-swatch" {value} oninput={emit} />
    <input type="text" class="color-hex" {value} spellcheck={false} oninput={emit} />
  </div>
</label>

<style>
  .color-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0;
    cursor: pointer;
  }

  .color-name {
    font-size: 12px;
    color: #a3a3a3;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .color-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .color-swatch {
    width: 28px;
    height: 24px;
    padding: 2px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #1e1e1e;
    cursor: pointer;
  }

  .color-hex {
    width: 76px;
    padding: 3px 7px;
    font-size: 12px;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: #e5e5e5;
    background: #1c1c1c;
    border: 1px solid #404040;
    border-radius: 5px;
    text-transform: lowercase;
  }

  .color-hex:focus {
    outline: none;
    border-color: #525252;
  }
</style>
