<script lang="ts">
  import { get } from "svelte/store";
  import { settings } from "$lib/stores/settings";
  import { iconTheme } from "$lib/stores/iconTheme";
  import { chatAppearance } from "$lib/stores/chatAppearance";
  import { explorerAppearance } from "$lib/stores/explorerAppearance";
  import { editorChrome } from "$lib/stores/editorChrome";
  import { syntaxTheme } from "$lib/stores/syntaxTheme";
  import {
    WORKBENCH_THEME_OPTIONS,
    applyWorkbenchTheme,
    type WorkbenchThemeId,
  } from "$lib/workbench-theme";
  import {
    CHAT_WAITING_STYLE_OPTIONS,
    type ChatWaitingStyle,
    type ChatAppearanceMap,
  } from "$lib/chat/chatAppearance";
  import {
    EXPLORER_SIZE_FIELDS,
    type ExplorerAppearanceMap,
  } from "$lib/explorer/explorerAppearance";
  import { type EditorChromeMap } from "$lib/editor/editorChrome";
  import {
    DEFAULT_TAB_UNIFORM_WIDTH_PX,
    TAB_UNIFORM_WIDTH_MAX,
    TAB_UNIFORM_WIDTH_MIN,
    normalizeUniformTabWidthPx,
  } from "$lib/editor/tabWidth";
  import { VSCODE_ICONS_ATTRIBUTION } from "$lib/icon-packs/types";
  import { pickIconPackFolder, isTauriAvailable } from "$lib/ipc";

  /**
   * General settings. Editor toggles + icon options persist immediately (owned here);
   * the live-preview appearance drafts (`chatColors`, `explorerColors`, `editorColors`,
   * `workbenchTheme`) are shared with AppearanceSettings, so they stay bound to the
   * parent, which commits them on Save.
   */
  interface Props {
    chatColors: ChatAppearanceMap;
    explorerColors: ExplorerAppearanceMap;
    editorColors: EditorChromeMap;
    workbenchTheme: WorkbenchThemeId;
  }

  let {
    chatColors = $bindable(),
    explorerColors = $bindable(),
    editorColors = $bindable(),
    workbenchTheme = $bindable(),
  }: Props = $props();

  const initial = get(settings);
  let editorWordWrap = $state(initial.editor.wordWrap);
  let editorFormatOnSave = $state(initial.editor.formatOnSave);
  let editorUniformTabWidth = $state(initial.editor.uniformTabWidth);
  let editorUniformTabWidthPx = $state(initial.editor.uniformTabWidthPx);
  let includeWorkspaceInChat = $state(initial.includeWorkspaceInChat);

  const initialIcons = get(iconTheme);
  let iconThemeId = $state<"seti" | "vscode-icons" | "codicons" | "custom">(initialIcons.themeId);
  let iconPackCustomPath = $state(initialIcons.customPackPath ?? "");
  let iconRefreshing = $state(false);
  let iconRefreshStatus = $state("");

  function persistHeaderTabWidthPx() {
    const px = normalizeUniformTabWidthPx(editorUniformTabWidthPx);
    editorUniformTabWidthPx = px;
    settings.setEditorSettings({ uniformTabWidthPx: px });
  }
</script>

<div class="stack">
  <h3 class="provider-page-title">General</h3>
  <p class="note">
    Editor, chat, explorer, theme, and icon options. Changes preview live where noted.
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
  <p class="group-label">Chat appearance</p>
  <label class="field">
    <span class="name">While waiting for the model</span>
    <span class="syntax-color-hint">Before tools or reasoning appear</span>
    <select
      class="input"
      value={chatColors.waitingStyle}
      onchange={(e) => {
        chatColors = {
          ...chatColors,
          waitingStyle: (e.currentTarget as HTMLSelectElement).value as ChatWaitingStyle,
        };
        chatAppearance.apply(chatColors);
      }}
    >
      {#each CHAT_WAITING_STYLE_OPTIONS as opt}
        <option value={opt.id}>{opt.label}</option>
      {/each}
    </select>
  </label>

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

  <p class="group-label">Theme</p>
  <p class="note muted">
    Workbench colors — editor background, sidebar, tabs, status bar, and terminal.
  </p>
  <label class="field">
    <span class="name">Color theme</span>
    <select
      class="input"
      bind:value={workbenchTheme}
      onchange={() => {
        applyWorkbenchTheme(workbenchTheme);
        editorColors = editorChrome.syncFromActiveTheme();
        syntaxTheme.syncFromActiveTheme();
      }}
    >
      {#each WORKBENCH_THEME_OPTIONS as opt}
        <option value={opt.id}>{opt.label}</option>
      {/each}
    </select>
  </label>

  <p class="group-label">Icons</p>
  <p class="note muted">
    File and folder icons in the explorer. Default pack:
    <a href={VSCODE_ICONS_ATTRIBUTION.repository} target="_blank" rel="noopener noreferrer">
      {VSCODE_ICONS_ATTRIBUTION.name}
    </a>
    ({VSCODE_ICONS_ATTRIBUTION.license}).
  </p>
  <label class="field">
    <span class="name">Icon theme</span>
    <select
      class="input"
      bind:value={iconThemeId}
      onchange={() => {
        iconTheme.setThemeId(iconThemeId);
        void iconTheme.reloadManifest();
      }}
    >
      <option value="seti">Seti (Cursor default)</option>
      <option value="vscode-icons">VS Code Icons (SVG)</option>
      <option value="codicons">Built-in codicons (simple)</option>
      <option value="custom">Custom folder…</option>
    </select>
  </label>
  {#if iconThemeId === "custom"}
    <label class="field">
      <span class="name">Custom pack folder</span>
      <div class="icon-pack-path-row">
        <input class="input" readonly value={iconPackCustomPath} placeholder="Select folder with manifest.json + icons/" />
        {#if isTauriAvailable()}
          <button
            type="button"
            class="btn secondary"
            onclick={async () => {
              const picked = await pickIconPackFolder();
              if (picked) {
                iconPackCustomPath = picked;
                iconTheme.setCustomPackPath(picked);
                await iconTheme.reloadManifest();
                iconTheme.bumpRevision();
              }
            }}
          >
            Browse…
          </button>
        {/if}
      </div>
    </label>
  {/if}
  <div class="icon-pack-actions">
    <button
      type="button"
      class="btn secondary"
      disabled={iconRefreshing}
      onclick={async () => {
        iconRefreshing = true;
        iconRefreshStatus = "";
        const result = await iconTheme.refreshBundledPack();
        iconRefreshing = false;
        iconRefreshStatus = result.ok
          ? `Refreshed pack (${result.path})`
          : `Refresh failed: ${result.error}`;
        void iconTheme.reloadManifest();
        iconTheme.bumpRevision();
      }}
    >
      {iconRefreshing ? "Refreshing…" : "Refresh default icon pack"}
    </button>
    <button
      type="button"
      class="btn ghost"
      onclick={async () => {
        iconTheme.invalidateManifest();
        await iconTheme.reloadManifest();
        iconTheme.bumpRevision();
      }}
    >
      Reload icons
    </button>
  </div>
  {#if iconRefreshStatus}
    <p class="note muted">{iconRefreshStatus}</p>
  {/if}
  <details class="attribution-details">
    <summary>Icon pack attribution</summary>
    <p class="note muted">
      {VSCODE_ICONS_ATTRIBUTION.copyright}. See
      <a href={VSCODE_ICONS_ATTRIBUTION.repository} target="_blank" rel="noopener noreferrer">
        {VSCODE_ICONS_ATTRIBUTION.repository}
      </a>.
    </p>
  </details>
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

  .btn {
    padding: 7px 14px;
    font-size: 12px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn.ghost {
    background: transparent;
    color: #a3a3a3;
    border-color: #404040;
  }

  .btn.ghost:hover {
    background: #333;
    color: #e5e5e5;
  }

  .btn.secondary {
    background: #333;
    color: #e5e5e5;
    border-color: #404040;
    white-space: nowrap;
  }

  .btn.secondary:hover:not(:disabled) {
    background: #404040;
  }

  .icon-pack-path-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .icon-pack-path-row .input {
    flex: 1;
    min-width: 0;
  }

  .icon-pack-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .attribution-details {
    margin: 0;
    font-size: 12px;
    color: #9a9a9a;
  }

  .attribution-details summary {
    cursor: pointer;
    color: #c8c8c8;
  }

  .attribution-details a {
    color: #6eb6ff;
  }
</style>
