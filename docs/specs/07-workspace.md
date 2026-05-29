# Workspace and Projects

> **Status:** ✅ **COMPLETE**

**Project = one opened folder.**

---

## Workspace Behavior

| Concern | Behavior | Status |
|---------|----------|--------|
| Explorer | Tree rooted at `workspacePath` | ✅ |
| System prompt | `.tinyllama/prompt.md` + mode base + workspace context block | ✅ |
| Tool cwd / paths | `executeTool(..., workspacePath)` | ✅ |
| Chat history | **Persisted** in `.tinyllama/state.json` per project | ✅ |
| Editor tabs | **Persisted** per project in `state.json` | ✅ |
| Global settings | API keys, theme, agent limits — machine-wide | ✅ |

---

## Workspace Resolution

Implemented in `commands.rs`:

1. `pick_workspace_folder` writes override to OS config dir
2. Otherwise uses `current_dir` at launch

---

## Explorer Ignore Rules

`list_dir` in Rust excludes:
- Dotfiles (`.git`, `.gitignore`, etc.)
- `node_modules`
- `target`
- `dist`

---

## Project-local Files

| Path | Purpose | Status |
|------|---------|--------|
| `.tinyllama/prompt.md` | Extra instructions for agent system prompt | ✅ |
| `.tinyllama/tools.json` | Per-project tool rules and custom tool schemas | ✅ |
| `.tinyllama/state.json` | Chat sessions, history, editor tab list (autosaved) | ✅ |
| `plans/*.md` | Persistent project plans (frontmatter + checklist) | ❌ See [19-planning-system.md](19-planning-system.md) |

---

## Project Lifecycle

### Opening a Folder

1. User picks folder via `pickWorkspaceFolder()` (Tauri native dialog)
2. `applyWorkspaceFolder()` → `switchProjectWorkspace()` in `projectState.ts`
3. Previous workspace state is saved; UI tabs cleared
4. New workspace tree loaded via `listDir`
5. `.tinyllama/state.json` restored (chat sessions, open editor tabs)
6. `.tinyllama/prompt.md` loaded into system prompt store
7. `.tinyllama/tools.json` merged into effective tool policy

### Autosave

Debounced (~1.2 s) save when `chat` or `workbench` stores change for the active workspace. Also saved on `beforeunload`.

---

## Known Limitations

| Limitation | Status | Notes |
|------------|--------|-------|
| Workspace lock | ❌ Not started | Prevent two windows corrupting `state.json` |
| File watcher → UI | ❌ Not started | Wire `watcher.rs` to `filesystemSync` |
