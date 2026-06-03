<script lang="ts">
  import { onMount } from "svelte";
  import { skills, ALL_SKILL_MODES, type SkillEntry } from "$lib/stores/skills";
  import { files } from "$lib/stores/files";
  import { isTauriAvailable } from "$lib/ipc";
  import type { ChatMode } from "$lib/stores/mode";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";
  import GearIcon from "phosphor-svelte/lib/GearIcon";

  const modeLabels: Record<ChatMode, string> = { chat: "Chat", plan: "Plan", agent: "Agent" };

  let initializing = $state(false);
  let createOpen = $state(false);
  let createTitle = $state("");
  let createDescription = $state("");
  let createContent = $state("");
  let createModes = $state<ChatMode[]>(["plan", "agent"]);
  let createSaving = $state(false);
  let busyId = $state<string | null>(null);
  let error = $state<string | null>(null);

  let editorEntry = $state<SkillEntry | null>(null);
  let editorDraft = $state("");
  let editorSaving = $state(false);

  const contentPlaceholder =
    "Markdown content injected into the system prompt when this skill is active.\n\n" +
    "Use {{workspace_name}}, {{git_branch}}, {{active_file}} for dynamic values.";

  async function ensureInitialized(): Promise<boolean> {
    const ws = $files.workspacePath;
    if (!ws || $skills.initialized) return Boolean($skills.initialized);
    await doInitialize();
    return $skills.initialized;
  }

  async function doInitialize() {
    const ws = $files.workspacePath;
    if (!ws || initializing) return;
    initializing = true;
    error = null;
    try {
      await skills.initialize(ws);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      initializing = false;
    }
  }

  async function toggleEnabled(entry: SkillEntry, enabled: boolean) {
    const ws = $files.workspacePath;
    if (!ws || busyId) return;
    busyId = entry.id;
    error = null;
    try {
      await skills.setEnabled(ws, entry.id, enabled);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busyId = null;
    }
  }

  async function toggleMode(entry: SkillEntry, mode: ChatMode, on: boolean) {
    const ws = $files.workspacePath;
    if (!ws || busyId) return;
    const nextModes = on
      ? [...entry.modes, mode]
      : entry.modes.filter((m) => m !== mode);
    busyId = entry.id;
    error = null;
    try {
      await skills.setModes(ws, entry.id, nextModes);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busyId = null;
    }
  }

  function openEditor(entry: SkillEntry) {
    editorEntry = entry;
    editorDraft = $skills.contents[entry.id] ?? "";
    error = null;
  }

  function closeEditor() {
    editorEntry = null;
    editorDraft = "";
  }

  async function openEditorForEntry(entry: SkillEntry) {
    if (!(await ensureInitialized())) return;
    openEditor(entry);
  }

  async function saveEditor() {
    const ws = $files.workspacePath;
    const entry = editorEntry;
    if (!ws || !entry || editorSaving) return;
    editorSaving = true;
    error = null;
    try {
      await skills.saveContent(ws, entry.id, editorDraft);
      closeEditor();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      editorSaving = false;
    }
  }

  function openCreateModal() {
    createTitle = "";
    createDescription = "";
    createContent = "";
    createModes = ["plan", "agent"];
    createOpen = true;
    error = null;
  }

  function closeCreateModal() {
    createOpen = false;
    createTitle = "";
    createDescription = "";
    createContent = "";
  }

  async function openCreateModalFromButton() {
    if (!(await ensureInitialized())) return;
    openCreateModal();
  }

  async function saveCreateModal() {
    const ws = $files.workspacePath;
    const title = createTitle.trim();
    if (!ws || createSaving || !title) return;
    createSaving = true;
    error = null;
    try {
      await skills.addSkill(ws, title, createDescription.trim(), createContent, createModes);
      closeCreateModal();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      createSaving = false;
    }
  }

  async function removeSkill(entry: SkillEntry) {
    const ws = $files.workspacePath;
    if (!ws || busyId) return;
    if (!confirm(`Remove skill "${entry.title}" and delete its files?`)) return;
    busyId = entry.id;
    error = null;
    try {
      await skills.removeSkill(ws, entry.id);
      if (editorEntry?.id === entry.id) closeEditor();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busyId = null;
    }
  }

  function toggleCreateMode(mode: ChatMode, on: boolean) {
    createModes = on
      ? [...createModes, mode]
      : createModes.filter((m) => m !== mode);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== "Escape") return;
    if (createOpen) closeCreateModal();
    else if (editorEntry) closeEditor();
  }

  $effect(() => {
    if ($files.workspacePath && isTauriAvailable()) {
      void skills.load($files.workspacePath);
    }
  });

  onMount(() => {
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  });

  let enabledCount = $derived($skills.entries.filter((e) => e.enabled).length);
</script>

<div class="skill-manager">
  {#if error}
    <div class="skill-error" role="alert">{error}</div>
  {/if}

  {#if !$files.workspacePath}
    <p class="skill-empty">Open a project folder to manage skills.</p>
  {:else if !isTauriAvailable()}
    <p class="skill-empty">Skills are available in the desktop app.</p>
  {:else}
    {#if !$skills.initialized}
      <div class="skill-setup">
        <p class="skill-setup-text">
          Skills are stored in <code>.sidebar/skills/</code> — one subdirectory per skill, each
          with a <code>skill.json</code> manifest and a <code>skill.md</code> content file.
        </p>
        <button
          type="button"
          class="skill-setup-btn"
          disabled={initializing}
          onclick={doInitialize}
        >
          {initializing ? "Initializing…" : "Initialize skills"}
        </button>
      </div>
    {/if}

    {#if $skills.initialized || $skills.entries.length > 0}
      <section class="skill-section">
        <p class="skill-section-hint">
          Enabled skills inject context into the system prompt before each turn. Mode checkboxes
          control where each skill applies. Use the gear icon to edit the <code>skill.md</code> content.
        </p>

        {#if $skills.entries.length === 0}
          <div class="skill-empty-state">
            <p>No skills yet — add one below.</p>
          </div>
        {:else}
          <div class="skill-table-wrap">
            <table class="skill-table">
              <colgroup>
                <col class="w-enable" />
                <col class="w-name" />
                <col class="w-mode" />
                <col class="w-mode" />
                <col class="w-mode" />
                <col class="w-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" class="cell-enable">Enable</th>
                  <th scope="col" class="cell-name">Skill</th>
                  {#each ALL_SKILL_MODES as mode (mode)}
                    <th scope="col" class="cell-mode">{modeLabels[mode]}</th>
                  {/each}
                  <th scope="col" class="cell-actions">Edit</th>
                </tr>
              </thead>
              <tbody>
                {#each $skills.entries as entry (entry.id)}
                  <tr>
                    <td class="cell-enable">
                      <label class="skill-enable-label" title={entry.enabled ? "Disable skill" : "Enable skill"}>
                        <input
                          type="checkbox"
                          checked={entry.enabled}
                          disabled={busyId === entry.id}
                          onchange={(e) =>
                            toggleEnabled(entry, (e.currentTarget as HTMLInputElement).checked)}
                        />
                      </label>
                    </td>
                    <td class="cell-name">
                      <span class="skill-row-label">{entry.title}</span>
                      {#if entry.description}
                        <span class="skill-row-desc">{entry.description}</span>
                      {/if}
                      <span class="skill-row-file">.sidebar/skills/{entry.id}/</span>
                    </td>
                    {#each ALL_SKILL_MODES as mode (mode)}
                      <td class="cell-mode">
                        <label class="skill-mode-check" title="Use in {modeLabels[mode]} mode">
                          <input
                            type="checkbox"
                            checked={entry.modes.includes(mode)}
                            disabled={busyId === entry.id}
                            onchange={(e) =>
                              toggleMode(entry, mode, (e.currentTarget as HTMLInputElement).checked)}
                          />
                        </label>
                      </td>
                    {/each}
                    <td class="cell-actions">
                      <div class="skill-actions-inner">
                        <button
                          type="button"
                          class="skill-icon-btn"
                          title="Edit skill.md"
                          aria-label="Edit {entry.title}"
                          disabled={busyId === entry.id}
                          onclick={() => openEditorForEntry(entry)}
                        >
                          <GearIcon size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          class="skill-icon-btn skill-icon-btn--danger"
                          title="Remove skill"
                          aria-label="Remove {entry.title}"
                          disabled={busyId === entry.id}
                          onclick={() => removeSkill(entry)}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

        <div class="skill-section-bar">
          <span class="skill-hint">
            {enabledCount} enabled · stored in <code>.sidebar/skills/</code>
          </span>
          <button
            type="button"
            class="skill-add-trigger"
            disabled={createSaving}
            onclick={() => openCreateModalFromButton()}
          >
            Add skill
          </button>
        </div>
      </section>
    {/if}
  {/if}
</div>

<!-- Create modal -->
{#if createOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="skill-backdrop" role="presentation" onclick={closeCreateModal}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="skill-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-create-title"
      onclick={(e) => e.stopPropagation()}
    >
      <header class="skill-modal-header">
        <h3 id="skill-create-title">Add skill</h3>
        <button type="button" class="skill-modal-close" onclick={closeCreateModal} aria-label="Close">×</button>
      </header>
      <div class="skill-create-fields">
        <label class="skill-create-field">
          <span class="skill-create-label">Title</span>
          <input
            type="text"
            class="skill-create-input"
            bind:value={createTitle}
            placeholder="e.g. React + TypeScript"
            disabled={createSaving}
          />
        </label>
        <label class="skill-create-field">
          <span class="skill-create-label">Description <span class="optional">(optional)</span></span>
          <input
            type="text"
            class="skill-create-input"
            bind:value={createDescription}
            placeholder="Short description shown in the table"
            disabled={createSaving}
          />
        </label>
        <div class="skill-create-field">
          <span class="skill-create-label">Modes</span>
          <div class="skill-mode-row">
            {#each ALL_SKILL_MODES as mode (mode)}
              <label class="skill-mode-pill">
                <input
                  type="checkbox"
                  checked={createModes.includes(mode)}
                  disabled={createSaving}
                  onchange={(e) => toggleCreateMode(mode, (e.currentTarget as HTMLInputElement).checked)}
                />
                {modeLabels[mode]}
              </label>
            {/each}
          </div>
        </div>
        <label class="skill-create-field">
          <span class="skill-create-label">Content <span class="optional">(skill.md)</span></span>
          <textarea
            class="skill-textarea skill-textarea--create"
            bind:value={createContent}
            rows="12"
            spellcheck="true"
            placeholder={contentPlaceholder}
            disabled={createSaving}
          ></textarea>
        </label>
      </div>
      <footer class="skill-modal-footer skill-modal-footer--end">
        <button
          type="button"
          class="skill-btn skill-btn--ghost"
          disabled={createSaving}
          onclick={closeCreateModal}
        >Cancel</button>
        <button
          type="button"
          class="skill-btn skill-btn--primary"
          disabled={createSaving || !createTitle.trim()}
          onclick={saveCreateModal}
        >
          {createSaving ? "Saving…" : "Save"}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Edit modal -->
{#if editorEntry}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="skill-backdrop" role="presentation" onclick={closeEditor}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="skill-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-editor-title"
      onclick={(e) => e.stopPropagation()}
    >
      <header class="skill-modal-header">
        <h3 id="skill-editor-title">Edit — {editorEntry.title}</h3>
        <button type="button" class="skill-modal-close" onclick={closeEditor} aria-label="Close">×</button>
      </header>
      <p class="skill-modal-file">
        <code>.sidebar/skills/{editorEntry.id}/skill.md</code>
      </p>
      <textarea
        class="skill-textarea"
        bind:value={editorDraft}
        rows="16"
        spellcheck="true"
        aria-label="Skill content"
      ></textarea>
      <footer class="skill-modal-footer">
        <div class="skill-modal-actions">
          <button
            type="button"
            class="skill-btn skill-btn--ghost"
            disabled={editorSaving}
            onclick={closeEditor}
          >Cancel</button>
          <button
            type="button"
            class="skill-btn skill-btn--primary"
            disabled={editorSaving}
            onclick={saveEditor}
          >
            {editorSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  .skill-manager {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .skill-error {
    margin-bottom: 8px;
    padding: 8px 10px;
    font-size: 11px;
    color: #f48771;
    background: rgba(244, 135, 113, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(244, 135, 113, 0.3);
  }

  .skill-empty {
    margin: 0;
    font-size: 11px;
    color: var(--muted-foreground);
  }

  .skill-setup {
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px dashed var(--border);
    background: color-mix(in srgb, var(--muted) 40%, transparent);
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .skill-setup-text {
    margin: 0;
    font-size: 11px;
    color: var(--muted-foreground);
    line-height: 1.45;
  }

  .skill-setup-text code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.95em;
  }

  .skill-setup-btn {
    align-self: flex-start;
    font-size: 12px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: var(--primary);
    color: var(--primary-foreground);
    cursor: pointer;
  }

  .skill-setup-btn:hover:not(:disabled) { filter: brightness(1.08); }
  .skill-setup-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .skill-section { margin-bottom: 0; }

  .skill-section-hint {
    margin: 0 0 10px;
    font-size: 11px;
    color: var(--muted-foreground);
    line-height: 1.45;
  }

  .skill-section-hint code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.95em;
  }

  .skill-empty-state {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--muted-foreground);
    border: 1px dashed var(--border);
    border-radius: 8px;
    margin-bottom: 10px;
  }

  .skill-empty-state p { margin: 0; }

  .skill-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--background);
    margin-bottom: 10px;
  }

  .skill-table {
    width: 100%;
    border-collapse: collapse;
  }

  .skill-table .w-enable { width: 3.5rem; }
  .skill-table .w-mode   { width: 3.5rem; }
  .skill-table .w-actions { width: 5.5rem; }
  .skill-table .w-name   { width: 100%; }

  .skill-table thead th {
    padding: 8px 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted-foreground);
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--muted) 35%, transparent);
  }

  .skill-table thead th.cell-enable,
  .skill-table thead th.cell-mode,
  .skill-table thead th.cell-actions { text-align: center; }

  .skill-table tbody td {
    padding: 8px 10px;
    vertical-align: middle;
    border-bottom: 1px solid var(--border);
  }

  .skill-table tbody td.cell-enable,
  .skill-table tbody td.cell-mode,
  .skill-table tbody td.cell-actions { text-align: center; }

  .skill-table tbody td.cell-name { text-align: left; }

  .skill-table tbody tr:last-child td { border-bottom: none; }
  .skill-table tbody tr:hover td {
    background: color-mix(in srgb, var(--muted) 22%, transparent);
  }

  .skill-enable-label, .skill-mode-check { cursor: pointer; }
  .skill-enable-label input, .skill-mode-check input {
    margin: 0;
    vertical-align: middle;
    cursor: pointer;
  }

  .skill-actions-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    vertical-align: middle;
  }

  .skill-row-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--foreground);
  }

  .skill-row-desc {
    display: block;
    font-size: 11px;
    color: var(--muted-foreground);
    margin-top: 1px;
  }

  .skill-row-file {
    display: block;
    margin-top: 2px;
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--muted-foreground);
    opacity: 0.7;
  }

  .skill-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
  }

  .skill-icon-btn:hover:not(:disabled) { background: var(--muted); color: var(--foreground); }
  .skill-icon-btn--danger:hover:not(:disabled) {
    background: rgba(244, 135, 113, 0.15);
    color: #f48771;
  }
  .skill-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .skill-section-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .skill-hint {
    font-size: 10px;
    color: var(--muted-foreground);
    line-height: 1.4;
  }

  .skill-hint code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.95em;
  }

  .skill-add-trigger {
    margin-left: auto;
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: var(--primary);
    color: var(--primary-foreground);
    cursor: pointer;
    flex-shrink: 0;
  }

  .skill-add-trigger:hover:not(:disabled) { filter: brightness(1.06); }
  .skill-add-trigger:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Modals */
  .skill-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.55);
  }

  .skill-modal {
    width: min(580px, 100%);
    max-height: min(88vh, 760px);
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--background);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
  }

  .skill-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 0;
    flex-shrink: 0;
  }

  .skill-modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; }

  .skill-modal-close {
    font-size: 1.25rem;
    line-height: 1;
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--muted-foreground);
    cursor: pointer;
  }

  .skill-modal-file {
    margin: 4px 16px 0;
    font-size: 11px;
    color: var(--muted-foreground);
    flex-shrink: 0;
  }

  .skill-modal-file code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .skill-create-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px 4px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .skill-create-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .skill-create-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted-foreground);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .optional {
    font-weight: 400;
    text-transform: none;
    opacity: 0.7;
  }

  .skill-create-input {
    font: inherit;
    font-size: 13px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--background);
    color: var(--foreground);
  }

  .skill-create-input:focus { outline: none; border-color: var(--ring); }

  .skill-mode-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .skill-mode-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--foreground);
    cursor: pointer;
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 99px;
    background: var(--background);
    user-select: none;
  }

  .skill-mode-pill:has(input:checked) {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--foreground);
  }

  .skill-mode-pill input { margin: 0; cursor: pointer; }

  .skill-textarea {
    margin: 12px 16px;
    flex: 1;
    min-height: 180px;
    padding: 10px 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--background);
    color: var(--foreground);
    resize: vertical;
  }

  .skill-textarea--create {
    margin: 0;
    min-height: 160px;
  }

  .skill-textarea:focus { outline: none; border-color: var(--ring); }

  .skill-modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 16px 14px;
    flex-shrink: 0;
  }

  .skill-modal-footer--end { justify-content: flex-end; }

  .skill-modal-actions { display: flex; gap: 8px; }

  .skill-btn {
    font: inherit;
    font-size: 12px;
    padding: 7px 14px;
    border-radius: 6px;
    border: 1px solid var(--border);
    cursor: pointer;
    background: var(--background);
    color: var(--foreground);
  }

  .skill-btn--ghost:hover:not(:disabled) { background: var(--muted); }

  .skill-btn--primary {
    border-color: transparent;
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .skill-btn--primary:hover:not(:disabled) { filter: brightness(1.06); }
  .skill-btn:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
