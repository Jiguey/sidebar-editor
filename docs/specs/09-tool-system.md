# Tool System

> **Status:** ✅ **COMPLETE**

---

## Built-in Tools (16)

See `src/lib/tools/toolDefinitions.ts` and `src/lib/tools/toolRunner.ts`.

### Read / Discovery Tools

| Tool | Description | Default Policy | Status |
|------|-------------|----------------|--------|
| `read_file` | Read file contents | allow | ✅ |
| `list_dir` | List directory contents | allow | ✅ |
| `grep` | Search with ripgrep (max 500 matches) | allow | ✅ |
| `find_file` | Find files by glob/substring | allow | ✅ |
| `get_file_tree` | Nested directory tree | allow | ✅ |
| `get_git_status` | List changed/staged/untracked files | allow | ✅ |
| `get_git_log` | Recent commits | allow | ✅ |
| `get_git_diff` | Diff against HEAD | allow | ✅ |
| `web_fetch` | HTTP GET (hostname allowlist) | ask | ✅ |

### Write / Execute Tools

| Tool | Description | Default Policy | Status |
|------|-------------|----------------|--------|
| `write_file` | Write/overwrite file | allow | ✅ |
| `create_file` | Create new file (fails if exists) | allow | ✅ |
| `delete_file` | Delete file/directory | ask | ✅ |
| `move_file` | Move/rename file | ask | ✅ |
| `run_shell` | Execute shell command | ask | ✅ |
| `run_tests` | Auto-detect and run test suite | ask | ✅ |
| `run_script` | Run script file | ask | ✅ |

---

## Custom Tools

Defined in Settings or `.sidebar/tools.json`:

```json
{
  "customTools": [
    {
      "name": "my_tool",
      "description": "...",
      "parameters": { ... }
    }
  ],
  "toolRules": {
    "my_tool": "allow"
  }
}
```

**Note:** Custom tools require a handler in `TOOL_HANDLERS` to execute; otherwise runtime returns `"Unknown tool"`.

---

## Tool Execution

`src/lib/tools/toolRunner.ts` — **`executeTool(name, args, workspacePath, context?)`**:

1. Requires Tauri environment
2. Requires valid workspace path (not `/` or empty)
3. Dispatches to `TOOL_HANDLERS` map
4. Returns `{ success: boolean, output: string }`

### Path Resolution

Paths resolved via `src/lib/tools/pathUtils.ts`:
- Workspace sandbox: blocks `..` traversal
- Absolute paths outside workspace rejected
- `/file.txt` treated as workspace-relative

---

## Tool Policy

### Resolution Order

1. Custom tool rule (from `.sidebar/tools.json`)
2. Per-tool rule (from global settings)
3. Default rule

### Policy Store

- **Global:** `localStorage` `sidebar.toolPolicy.v2` + Settings UI
- **Project:** `.sidebar/tools.json` merged via `effectiveToolPolicy`

### Functions

- `getActiveToolDefinitions(state)` — builds tool list for model
- `getToolsForPolicy(state, modeToolNames)` — intersects mode list with active definitions
- `resolveToolRule()` — applies resolution order

---

## Tool-specific Notes

### `web_fetch`

- Requires non-empty host allowlist from settings
- Rust `web_fetch` enforces hostname match
- Default hosts: `github.com`, `raw.githubusercontent.com`, `docs.rs`, `developer.mozilla.org`

### `run_tests`

Auto-detects test runner:
- `package.json` → `pnpm test` / `npm test`
- `Cargo.toml` → `cargo test`
- `pytest.ini` / `setup.py` → `pytest`

### `grep`

- Invokes ripgrep (`rg`) in Rust backend
- Max 500 matches returned
- Supports optional file glob filter

---

## Known Limitations & Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| Custom tool handlers | ❌ Not started | Filter tools without handlers |
| Parallel read-only tools | ❌ Not started | Execute read tools in parallel |
| Rust path enforcement | ❌ Not started | Canonicalize paths in Rust |
