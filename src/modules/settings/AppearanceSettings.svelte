<script lang="ts">
  import { syntaxTheme } from "$lib/stores/syntaxTheme";
  import { editorChrome } from "$lib/stores/editorChrome";
  import { explorerAppearance } from "$lib/stores/explorerAppearance";
  import { chatAppearance } from "$lib/stores/chatAppearance";
  import { SYNTAX_COLOR_FIELDS, type SyntaxColorMap } from "$lib/editor/syntaxColors";
  import { EDITOR_CHROME_FIELDS, type EditorChromeMap } from "$lib/editor/editorChrome";
  import {
    EXPLORER_COLOR_FIELDS,
    type ExplorerAppearanceMap,
  } from "$lib/explorer/explorerAppearance";
  import {
    CHAT_APPEARANCE_COLOR_FIELDS,
    type ChatAppearanceMap,
  } from "$lib/chat/chatAppearance";
  import { applyWorkbenchTheme, type WorkbenchThemeId } from "$lib/workbench-theme";
  import SettingsColorField from "./SettingsColorField.svelte";

  /**
   * The four appearance subsections. Color maps are bound back to SettingsPane,
   * which owns the draft state and commits it on Save; `*.apply()` only previews live.
   */
  export type AppearanceSection =
    | "appearance-editor"
    | "appearance-explorer"
    | "appearance-chat"
    | "appearance-syntax";

  interface Props {
    section: AppearanceSection;
    syntaxColors: SyntaxColorMap;
    editorColors: EditorChromeMap;
    explorerColors: ExplorerAppearanceMap;
    chatColors: ChatAppearanceMap;
    workbenchTheme: WorkbenchThemeId;
    onNavigate: (section: "general" | "appearance-syntax") => void;
  }

  let {
    section,
    syntaxColors = $bindable(),
    editorColors = $bindable(),
    explorerColors = $bindable(),
    chatColors = $bindable(),
    workbenchTheme,
    onNavigate,
  }: Props = $props();

  function setEditorColor(key: keyof EditorChromeMap, value: string) {
    editorColors = { ...editorColors, [key]: value };
    editorChrome.apply(editorColors);
  }

  function setExplorerColor(key: keyof ExplorerAppearanceMap, value: string) {
    explorerColors = { ...explorerColors, [key]: value };
    explorerAppearance.apply(explorerColors);
  }

  function setChatColor(key: keyof ChatAppearanceMap, value: string) {
    chatColors = { ...chatColors, [key]: value };
    chatAppearance.apply(chatColors);
  }

  function setSyntaxColor(key: keyof SyntaxColorMap, value: string) {
    syntaxColors = { ...syntaxColors, [key]: value };
    syntaxTheme.apply(syntaxColors);
  }
</script>

{#if section === "appearance-editor"}
  <div class="stack">
    <div class="section-header">
      <h3 class="provider-page-title">Editor</h3>
      <div class="header-actions">
        <button
          type="button"
          class="btn ghost small"
          onclick={() => { applyWorkbenchTheme(workbenchTheme); editorColors = editorChrome.syncFromActiveTheme(); }}
        >Sync from theme</button>
        <button
          type="button"
          class="btn ghost small"
          onclick={() => { editorColors = editorChrome.resetToDefaults(); }}
        >Reset to default</button>
      </div>
    </div>
    <p class="note">
      Syntax tokens →
      <button type="button" class="linkish" onclick={() => onNavigate("appearance-syntax")}>Syntax</button>.
      Theme, wrap, tab width →
      <button type="button" class="linkish" onclick={() => onNavigate("general")}>General</button>.
    </p>
    {#each EDITOR_CHROME_FIELDS as field}
      <SettingsColorField
        label={field.label}
        hint={field.hint}
        value={editorColors[field.key]}
        onChange={(v) => setEditorColor(field.key, v)}
      />
    {/each}
    <div
      class="editor-chrome-preview"
      style={`background:${editorColors.bg};color:${editorColors.fg};`}
      aria-hidden="true"
    >
      <span style={`color:${editorColors.gutterFg}`}>1</span>
      <span> function hello() {'{'}</span>
      <span
        class="editor-chrome-preview__selection"
        style={`background:${editorColors.selection}`}
      >
        return "world";
      </span>
      <span> {'}'}</span>
    </div>
  </div>
{:else if section === "appearance-explorer"}
  <div class="stack">
    <div class="section-header">
      <h3 class="provider-page-title">Explorer</h3>
      <div class="header-actions">
        <button
          type="button"
          class="btn ghost small"
          onclick={() => { explorerColors = explorerAppearance.resetToDefaults(); }}
        >Reset to default</button>
      </div>
    </div>
    <p class="note">
      File tree selection and git status colors. Label and icon sizes →
      <button type="button" class="linkish" onclick={() => onNavigate("general")}>General</button>.
    </p>
    {#each EXPLORER_COLOR_FIELDS as field}
      <SettingsColorField
        label={field.label}
        hint={field.hint}
        value={explorerColors[field.key] as string}
        onChange={(v) => setExplorerColor(field.key, v)}
      />
    {/each}
  </div>
{:else if section === "appearance-chat"}
  <div class="stack">
    <div class="section-header">
      <h3 class="provider-page-title">Chat activity</h3>
      <div class="header-actions">
        <button
          type="button"
          class="btn ghost small"
          onclick={() => { chatColors = chatAppearance.resetToDefaults(); }}
        >Reset to default</button>
      </div>
    </div>
    <p class="note">
      Agent feed colors for thoughts, tools, and badges. Waiting indicator →
      <button type="button" class="linkish" onclick={() => onNavigate("general")}>General</button>.
    </p>
    {#each CHAT_APPEARANCE_COLOR_FIELDS as field}
      <SettingsColorField
        label={field.label}
        hint={field.hint}
        value={chatColors[field.key]}
        onChange={(v) => setChatColor(field.key, v)}
      />
    {/each}
  </div>
{:else if section === "appearance-syntax"}
  <div class="stack">
    <div class="section-header">
      <h3 class="provider-page-title">Syntax highlighting</h3>
      <div class="header-actions">
        <button
          type="button"
          class="btn ghost small"
          onclick={() => { syntaxColors = syntaxTheme.resetToDefaults(); }}
        >Reset to default</button>
      </div>
    </div>
    <div class="syntax-preview" aria-hidden="true">
      <p class="syntax-preview-label">TypeScript</p>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.comment}">// comment</span></span>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.keyword}">const</span> <span style="color: {syntaxColors.variable}">count</span> <span style="color: {syntaxColors.operator}">=</span> <span style="color: {syntaxColors.number}">42</span><span style="color: {syntaxColors.punctuation}">;</span></span>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.keyword}">class</span> <span style="color: {syntaxColors.type}">MyClass</span> <span style="color: {syntaxColors.punctuation}">{`{`}</span></span>
      <span class="syntax-preview-line">  <span style="color: {syntaxColors.function}">render</span><span style="color: {syntaxColors.punctuation}">()</span> <span style="color: {syntaxColors.punctuation}">{`{`}</span> <span style="color: {syntaxColors.keyword}">return</span> <span style="color: {syntaxColors.string}">"hello"</span><span style="color: {syntaxColors.punctuation}">;</span> <span style="color: {syntaxColors.punctuation}">{`}`}</span></span>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.punctuation}">{`}`}</span></span>
      <p class="syntax-preview-label">Markdown</p>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.heading}; font-weight:700"># Title</span></span>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.link}">[link](https://example.com)</span></span>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.emphasis}">*emphasis*</span> <span style="color: {syntaxColors.strong}; font-weight:700">**strong**</span></span>
      <span class="syntax-preview-line"><span style="color: {syntaxColors.meta}">```ts</span></span>
    </div>
    <h4 class="settings-subheading">Code tokens</h4>
    {#each SYNTAX_COLOR_FIELDS.filter((f) => f.group !== "markdown") as field}
      <SettingsColorField
        label={field.label}
        hint={field.hint}
        value={syntaxColors[field.key]}
        onChange={(v) => setSyntaxColor(field.key, v)}
      />
    {/each}
    <h4 class="settings-subheading">Markdown tokens</h4>
    {#each SYNTAX_COLOR_FIELDS.filter((f) => f.group === "markdown") as field}
      <SettingsColorField
        label={field.label}
        hint={field.hint}
        value={syntaxColors[field.key]}
        onChange={(v) => setSyntaxColor(field.key, v)}
      />
    {/each}
  </div>
{/if}

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 2px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .provider-page-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #e8e8e8;
  }

  .note {
    font-size: 11px;
    line-height: 1.4;
    color: #5c5c5c;
    margin: 0;
  }

  .settings-subheading {
    margin: 10px 0 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #525252;
  }

  .linkish {
    padding: 0;
    border: none;
    background: none;
    color: var(--primary);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .btn {
    padding: 4px 10px;
    font-size: 11px;
    border-radius: 5px;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn.ghost {
    background: transparent;
    color: #737373;
    border-color: #383838;
  }

  .btn.ghost:hover {
    background: #2a2a2a;
    color: #d4d4d4;
  }

  .syntax-preview {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: 6px;
    background: var(--editor-bg, #1a1b26);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    line-height: 1.5;
  }

  .syntax-preview-line {
    display: block;
    white-space: pre;
  }

  .syntax-preview-label {
    margin: 8px 0 2px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted-foreground);
  }

  .syntax-preview-label:first-child {
    margin-top: 0;
  }

  .editor-chrome-preview {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    line-height: 1.5;
    border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  }

  .editor-chrome-preview__selection {
    padding: 0 2px;
    border-radius: 2px;
  }
</style>
