<script lang="ts">
  import { get } from "svelte/store";
  import { settings } from "$lib/stores/settings";
  import { explorerAppearance } from "$lib/stores/explorerAppearance";
  import {
    EXPLORER_SIZE_FIELDS,
    type ExplorerAppearanceMap,
  } from "$lib/explorer/explorerAppearance";
  import {
    DEFAULT_TAB_UNIFORM_WIDTH_PX,
    TAB_UNIFORM_WIDTH_MAX,
    TAB_UNIFORM_WIDTH_MIN,
    normalizeUniformTabWidthPx,
  } from "$lib/editor/tabWidth";

  /**
   * General settings. Editor toggles persist immediately; explorer size drafts
   * are shared with AppearanceSettings and commit on Save from SettingsPane.
   */
  interface Props {
    explorerColors: ExplorerAppearanceMap;
  }

  let { explorerColors = $bindable() }: Props = $props();

  const initial = get(settings);
  let editorWordWrap = $state(initial.editor.wordWrap);
  let editorFormatOnSave = $state(initial.editor.formatOnSave);
  let editorUniformTabWidth = $state(initial.editor.uniformTabWidth);
  let editorUniformTabWidthPx = $state(initial.editor.uniformTabWidthPx);
  let includeWorkspaceInChat = $state(initial.includeWorkspaceInChat);

  function persistHeaderTabWidthPx() {
    const px = normalizeUniformTabWidthPx(editorUniformTabWidthPx);
    editorUniformTabWidthPx = px;
    settings.setEditorSettings({ uniformTabWidthPx: px });
  }
</script>

<div class="stack">
  <h3 class="provider-page-title">General</h3>
  <p class="note">
    Editor, chat, and explorer options. Theme and icon colors → Appearance.
  </p>

  <p class="group-label">Editor</p>
  <label class="field checkbox-field">
    <input
      type="checkbox"
      bind:checked={editorWordWrap}
      onchange={() => settings.setEditorSettings({ wordWrap: editorWordWrap })}
    />
    <span class="name">Wrap lines</span>
  </label>
  <label class="field checkbox-field">
    <input
      type="checkbox"
      bind:checked={editorFormatOnSave}
      onchange={() => settings.setEditorSettings({ formatOnSave: editorFormatOnSave })}
    />
    <span class="name">Format on save (Prettier)</span>
  </label>
  <label class="field">
    <span class="name">Header tab width</span>
    <span class="syntax-color-hint">{TAB_UNIFORM_WIDTH_MIN}–{TAB_UNIFORM_WIDTH_MAX} px</span>
    <input
      type="number"
      class="input tab-width-input"
      min={TAB_UNIFORM_WIDTH_MIN}
      max={TAB_UNIFORM_WIDTH_MAX}
      step="4"
      bind:value={editorUniformTabWidthPx}
      onchange={persistHeaderTabWidthPx}
    />
  </label>
  <label class="field checkbox-field">
    <input
      type="checkbox"
      bind:checked={editorUniformTabWidth}
      onchange={() =>
        settings.setEditorSettings({
          uniformTabWidth: editorUniformTabWidth,
          uniformTabWidthPx: normalizeUniformTabWidthPx(editorUniformTabWidthPx),
        })}
    />
    <span class="name">Uniform tab width in header</span>
  </label>
  <p class="note muted">
    Default {DEFAULT_TAB_UNIFORM_WIDTH_PX} px. With uniform on, chat and workbench tabs use this
    width; off, tabs size to their titles. Scroll the tab row with the mouse wheel.
  </p>
  <p class="note muted">
    Manual format:
    <kbd class="inline-code">Shift</kbd>+<kbd class="inline-code">Alt</kbd>+<kbd class="inline-code">F</kbd>
    or the Prettier icon in the status bar.
  </p>

  <p class="group-label">Chat</p>
  <label class="field checkbox-field">
    <input
      type="checkbox"
      checked={includeWorkspaceInChat}
      onchange={(e) => {
        includeWorkspaceInChat = (e.currentTarget as HTMLInputElement).checked;
        settings.setIncludeWorkspaceInChat(includeWorkspaceInChat);
      }}
    />
    <span class="name">Include workspace context in chat mode</span>
  </label>
  <p class="note muted">
    Plan and Agent modes always include workspace context. Chat mode omits it unless this
    is enabled.
  </p>

  <p class="group-label">Explorer</p>
  {#each EXPLORER_SIZE_FIELDS as field}
    <label class="field">
      <span class="name">{field.label}</span>
      <span class="syntax-color-hint">{field.hint}</span>
      <input
        type="number"
        class="input"
        min={field.min}
        max={field.max}
        value={explorerColors[field.key] as number}
        oninput={(e) => {
          const v = Number((e.currentTarget as HTMLInputElement).value);
          explorerColors = { ...explorerColors, [field.key]: v };
          explorerAppearance.apply(explorerColors);
        }}
      />
    </label>
  {/each}
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .provider-page-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #e8e8e8;
  }

  .group-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #737373;
    margin: 4px 0 -4px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .checkbox-field {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-direction: row;
  }

  .checkbox-field .name {
    margin: 0;
  }

  .name {
    font-size: 12px;
    color: #a3a3a3;
  }

  .syntax-color-hint {
    display: block;
    font-size: 11px;
    color: #888;
    margin-top: 2px;
    font-family: var(--font-mono, ui-monospace, monospace);
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

  .tab-width-input {
    width: 4.5rem;
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
</style>
