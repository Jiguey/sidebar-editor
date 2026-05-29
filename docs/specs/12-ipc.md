# Tauri IPC

> **Status:** ✅ **COMPLETE**

---

## Commands Reference

### Filesystem

| Command | Purpose | Status |
|---------|---------|--------|
| `list_dir` | List directory contents | ✅ |
| `read_file` | Read file contents | ✅ |
| `write_file` | Write file contents | ✅ |
| `rename_entry` | Rename/move file or directory | ✅ |
| `delete_entry` | Delete file or directory | ✅ |
| `path_exists` | Check if path exists | ✅ |

### Discovery

| Command | Purpose | Status |
|---------|---------|--------|
| `find_files` | Find files by glob pattern | ✅ |
| `list_dir_tree` | Get nested directory tree | ✅ |
| `grep_workspace` | Search with ripgrep | ✅ |

### Shell / Network

| Command | Purpose | Status |
|---------|---------|--------|
| `run_shell` | Execute shell command | ✅ |
| `web_fetch` | HTTP GET with host allowlist | ✅ |

### Workspace

| Command | Purpose | Status |
|---------|---------|--------|
| `get_workspace_path` | Get current workspace path | ✅ |
| `pick_workspace_folder` | Native folder picker | ✅ |

### Git

| Command | Purpose | Status |
|---------|---------|--------|
| `git_status` | List changed files | ✅ |
| `git_diff` | Get diff against HEAD | ✅ |
| `git_stage` | Stage file | ✅ |
| `git_unstage` | Unstage file | ✅ |
| `git_commit` | Create commit | ✅ |
| `git_log` | Get recent commits | ✅ |
| `git_branch` | Get current branch | ✅ |
| `git_discard` | Discard changes | ✅ |
| `git_file_at_head` | Get file content at HEAD | ✅ |
| `git_create_checkpoint` | Create checkpoint commit | ✅ |
| `git_restore_checkpoint` | Restore from checkpoint | ✅ |
| `git_is_repo` | Check if git repo | ✅ |

### Terminal (PTY)

| Command | Purpose | Status |
|---------|---------|--------|
| `pty_create` | Create PTY session | ✅ |
| `pty_write` | Write to PTY | ✅ |
| `pty_resize` | Resize PTY | ✅ |
| `pty_close` | Close PTY session | ✅ |

### Project State

| Command | Purpose | Status |
|---------|---------|--------|
| `read_system_prompt` | Read `.tinyllama/prompt.md` | ✅ |
| `write_system_prompt` | Write `.tinyllama/prompt.md` | ✅ |
| `read_project_state` | Read `.tinyllama/state.json` | ✅ |
| `write_project_state` | Write `.tinyllama/state.json` | ✅ |

### Window

| Command | Purpose | Status |
|---------|---------|--------|
| `open_settings_window` | Open settings webview | ✅ |

### Icons

| Command | Purpose | Status |
|---------|---------|--------|
| `icon_pack_get_dir` | Get icon pack directory | ✅ |
| `icon_pack_refresh_bundled` | Refresh bundled packs | ✅ |
| `pick_icon_pack_folder` | Native folder picker for icons | ✅ |

---

## Removed Commands (sidecar / harness era)

These belonged to the **removed Node sidecar** design. They are **not** registered in `src-tauri/src/main.rs` and must not be reintroduced without an explicit architecture decision.

| Removed command / event | Former role |
|-------------------------|-------------|
| `start_harness` | Spawn sidecar, pass provider/model/policy |
| `send_to_harness` | JSON-line messages (`chat`, `clear`, …) |
| `stop_harness` | Tear down sidecar process |
| `harness:event` | Stream events (`tool_start`, `tool_approval_needed`, …) |

**Current replacement:**

| Concern | Current mechanism |
|---------|-------------------|
| Streaming | `streamOneTurn()` + provider `fetch` in webview |
| Tool approval | `ChatPane` UI + `executeToolCallsWithApproval()` |
| Tool results | `executeTool()` → commands in [command table above](#commands-reference) |

See [03-architecture.md](03-architecture.md#former-sidecar-design-removed).

---

## Events

| Event | Purpose | Status |
|-------|---------|--------|
| `pty:data` | Terminal output data | ✅ |
| `pty:exit` | Terminal session exit | ✅ |
| `fs:changed` | File system changes | 🔶 Defined but not wired |

---

## Frontend Wrapper

`src/lib/ipc.ts`:
- Lazy-loads Tauri API
- Provides typed wrapper functions
- `isTauriAvailable()` for degraded Vite-only dev

---

## Known Limitations

| Limitation | Status | Notes |
|------------|--------|-------|
| File watcher events | ❌ Not wired | `fs:changed` defined but not used |
| Rust path sandbox | ❌ Not started | FS commands accept any path |
