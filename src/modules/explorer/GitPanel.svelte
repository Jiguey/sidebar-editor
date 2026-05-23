<script lang="ts">
  import { files } from "$lib/stores/files";
  import {
    gitStatus,
    gitStage,
    gitUnstage,
    gitLog,
    gitCurrentBranch,
    isTauriAvailable,
  } from "$lib/ipc";
  import { invokeSafe } from "$lib/invokeSafe";
  import type { GitLogEntry, GitPathStatus } from "$lib/gitTypes";
  import { Button } from "$lib/components/ui/button/index.js";

  let rows = $state<GitPathStatus[]>([]);
  let log = $state<GitLogEntry[]>([]);
  let branch = $state<string | null>(null);
  let err = $state<string | null>(null);
  let commitMsg = $state("");
  let busy = $state(false);

  const root = $derived($files.workspacePath);

  async function refresh() {
    err = null;
    const repo = root;
    if (!isTauriAvailable() || !repo) {
      rows = [];
      log = [];
      branch = null;
      return;
    }
    busy = true;
    try {
      branch = await gitCurrentBranch(repo);
      rows = await gitStatus(repo);
      log = await gitLog(repo, 24);
    } catch (e) {
      err = String(e);
      rows = [];
      log = [];
    } finally {
      busy = false;
    }
  }

  $effect(() => {
    void root;
    void refresh();
  });

  let staged = $derived(rows.filter((r) => r.index !== "-" && r.index !== "??"));
  let unstaged = $derived(rows.filter((r) => r.worktree !== "-"));

  async function stage(p: string) {
    const repo = root;
    if (!repo) return;
    await gitStage(repo, p);
    await refresh();
  }

  async function unstage(p: string) {
    const repo = root;
    if (!repo) return;
    await gitUnstage(repo, p);
    await refresh();
  }

  async function commit() {
    const repo = root;
    const msg = commitMsg.trim();
    if (!repo || !msg) return;
    busy = true;
    try {
      const r = await invokeSafe<string>("git_commit", { repoPath: repo, message: msg });
      if (!r.ok) {
        err = r.error.message;
        return;
      }
      commitMsg = "";
      await refresh();
    } catch (e) {
      err = String(e);
    } finally {
      busy = false;
    }
  }
</script>

<div class="git-panel">
  {#if !root}
    <p class="muted">Open a workspace folder to use Git.</p>
  {:else if err}
    <p class="err">{err}</p>
    <Button variant="outline" size="sm" onclick={() => void refresh()}>Retry</Button>
  {:else}
    <div class="head">
      <span class="branch">{branch ?? "detached"}</span>
      <Button variant="ghost" size="sm" onclick={() => void refresh()} disabled={busy}>Refresh</Button>
    </div>

    <p class="label">Staged</p>
    <ul class="list">
      {#each staged as r (r.path)}
        <li>
          <code>{r.index}</code>
          <span class="p">{r.path}</span>
          <button type="button" class="link" onclick={() => void unstage(r.path)}>Unstage</button>
        </li>
      {:else}
        <li class="muted">Nothing staged</li>
      {/each}
    </ul>

    <p class="label">Changes</p>
    <ul class="list">
      {#each unstaged as r (r.path)}
        <li>
          <code>{r.worktree}</code>
          <span class="p">{r.path}</span>
          {#if r.worktree !== "??"}
            <button type="button" class="link" onclick={() => void stage(r.path)}>Stage</button>
          {/if}
        </li>
      {:else}
        <li class="muted">Working tree clean</li>
      {/each}
    </ul>

    <label class="commit">
      <span class="label">Commit message</span>
      <textarea bind:value={commitMsg} rows="2" class="ta" placeholder="Describe your change"></textarea>
      <Button size="sm" onclick={() => void commit()} disabled={busy || !commitMsg.trim()}>Commit</Button>
    </label>

    <p class="label">Recent commits</p>
    <ul class="log">
      {#each log as e (e.oid)}
        <li title={e.oid}>
          <span class="subj">{e.summary}</span>
          <span class="meta">{e.author}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .git-panel {
    padding: 10px 12px;
    font-size: 12px;
    color: var(--sidebar-foreground);
    overflow: auto;
    height: 100%;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .branch {
    font-weight: 600;
    font-family: ui-monospace, monospace;
  }
  .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted-foreground);
    margin: 10px 0 4px;
  }
  .list,
  .log {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .list li,
  .log li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--sidebar-border) 50%, transparent);
  }
  .p {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  code {
    font-size: 10px;
    color: var(--muted-foreground);
  }
  .link {
    background: none;
    border: none;
    color: var(--sidebar-primary);
    cursor: pointer;
    font-size: 11px;
    padding: 0;
  }
  .muted {
    color: var(--muted-foreground);
  }
  .err {
    color: var(--destructive, #f87171);
    margin-bottom: 8px;
  }
  .commit {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 12px 0;
  }
  .ta {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    background: var(--sidebar-accent);
    border: 1px solid var(--sidebar-border);
    border-radius: 4px;
    color: inherit;
    padding: 6px;
  }
  .subj {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    font-size: 10px;
    color: var(--muted-foreground);
    flex-shrink: 0;
  }
</style>
