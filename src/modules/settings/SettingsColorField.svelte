<script lang="ts">
  /** One labelled color row: a swatch + hex input that report edits via `onChange`. */
  interface Props {
    label: string;
    hint: string;
    value: string;
    onChange: (value: string) => void;
  }

  let { label, hint, value, onChange }: Props = $props();

  const emit = (e: Event) => onChange((e.currentTarget as HTMLInputElement).value);
</script>

<label class="field syntax-color-field">
  <span class="name">{label}</span>
  <span class="syntax-color-hint">{hint}</span>
  <div class="syntax-color-row">
    <input type="color" class="syntax-color-swatch" {value} oninput={emit} />
    <input type="text" class="input syntax-color-hex" {value} spellcheck={false} oninput={emit} />
  </div>
</label>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .name {
    font-size: 12px;
    color: #a3a3a3;
  }

  .input {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    color: #e5e5e5;
    background: #1c1c1c;
    border: 1px solid #404040;
    border-radius: 6px;
  }

  .input:focus {
    outline: none;
    border-color: #525252;
  }

  .syntax-color-field .name {
    display: block;
  }

  .syntax-color-hint {
    display: block;
    font-size: 11px;
    color: #888;
    margin-top: 2px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .syntax-color-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
  }

  .syntax-color-swatch {
    width: 36px;
    height: 32px;
    padding: 2px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #1e1e1e;
    cursor: pointer;
  }

  .syntax-color-hex {
    flex: 1;
    min-width: 0;
    font-family: var(--font-mono, ui-monospace, monospace);
    text-transform: lowercase;
  }
</style>
