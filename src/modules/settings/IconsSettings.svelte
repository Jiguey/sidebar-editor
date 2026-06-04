<script lang="ts">
  import { get } from "svelte/store";
  import { iconTheme } from "$lib/stores/iconTheme";
  import { VSCODE_ICONS_ATTRIBUTION } from "$lib/icon-packs/types";
  import { pickIconPackFolder, isTauriAvailable } from "$lib/ipc";

  const initialIcons = get(iconTheme);
  let iconThemeId = $state<"seti" | "vscode-icons" | "codicons" | "custom">(initialIcons.themeId);
  let iconPackCustomPath = $state(initialIcons.customPackPath ?? "");
  let iconRefreshing = $state(false);
  let iconRefreshStatus = $state("");
</script>

<div class="stack">
  <h3 class="provider-page-title">Icons</h3>
  <p class="note">
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

  .note {
    font-size: 12px;
    line-height: 1.45;
    color: #737373;
    margin: 0;
  }

  .note.muted {
    color: #5c5c5c;
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
