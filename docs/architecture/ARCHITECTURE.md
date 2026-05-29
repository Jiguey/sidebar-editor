# Tiny Llama — Architecture Reference

> **Status:** ✅ **COMPLETE** — This document reflects the current implementation.
>
> See also: [Overview](../overview/OVERVIEW.md) · [Specifications](../specs/README.md) · [README](../../README.md)

This document describes how **Tiny Llama** works end-to-end: UI layout, state management, AI agent loop, tool calling, theming, and Rust backend.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Application Bootstrap](#2-application-bootstrap)
3. [Workbench UI Layout](#3-workbench-ui-layout)
4. [State Management](#4-state-management)
5. [AI Chat Subsystem](#5-ai-chat-subsystem)
6. [Multi-Turn Tool Calling](#6-multi-turn-tool-calling)
7. [Tool System](#7-tool-system)
8. [Rust Backend](#8-rust-backend)
9. [Theming Systems](#9-theming-systems)
10. [File Icons](#10-file-icons)
11. [Editor & Syntax](#11-editor--syntax)
12. [Git Integration](#12-git-integration)
13. [Terminal (PTY)](#13-terminal-pty)
14. [Directory Map](#14-directory-map)

---

## 1. System Architecture

> **Status:** ✅ Complete

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Svelte Frontend (src/)                            │
│                                                                           │
│  WorkbenchShell ──┬── ChatPane (agent loop, streaming, tool approval)    │
│                   ├── CenterWorkbench (editor / terminal / preview tabs) │
│                   └── RightSidebar (explorer, search, git)                 │
│                                                                           │
│  Stores: chat, files, workbench, settings, toolPolicy, mode, iconTheme   │
│                                                                           │
│  lib/agent/     conversation.ts, streamTurn.ts                           │
│  lib/providers/ openaiCompat.ts, anthropic.ts  ──► fetch() to LLM APIs    │
│  lib/tools/     toolDefinitions.ts, toolRunner.ts ──► ipc.ts             │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ Tauri invoke + events (pty:data, pty:exit)
┌───────────────────────────────▼──────────────────────────────────────────┐
│                    Rust Backend (src-tauri/src/)                          │
│  filesystem.rs   read/write/list/grep/find/tree/web_fetch                │
│  git.rs          status, diff, stage, commit, log, discard, checkpoints  │
│  pty.rs          create/write/resize/close + event emit                  │
│  commands.rs     Tauri command handlers + settings window                │
│  icon_pack.rs    bundled icon pack paths                                 │
│  watcher.rs      file system watching (infrastructure, not wired)        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Data flow summary:**

1. User types in chat → `ChatPane` runs the agent loop
2. Each turn calls `streamOneTurn()` → provider streams text + tool call deltas
3. Tool calls pass through policy gates → `executeTool()` → `ipc.ts` → Rust commands
4. Tool results appended to provider message history → next turn
5. Filesystem mutations trigger `filesystemSync.ts` to refresh explorer and editor tabs

### No Node sidecar

Tiny Llama **does not** run a separate Node process for the agent. An earlier design used `sidecar/dist/index.js` with harness Tauri IPC; that path was **removed**. Today:

- **Agent loop, streaming, tool policy, and provider `fetch()`** live in the Svelte webview (`ChatPane`, `streamTurn.ts`, `lib/providers/*`).
- **Filesystem, git, terminal, grep, shell, HTTP fetch** live in Rust (`src-tauri/src/modules/*`).
- **Node.js** is dev/build only (Vite, Vitest, Tauri CLI)—not an app runtime for chat.

See [specs/03-architecture.md](../specs/03-architecture.md#agent-runtime-model-current) for the full before/after table.

---

## 2. Application Bootstrap

> **Status:** ✅ Complete

| Entry | File | Role |
|-------|------|------|
| Main window | `index.html` → `src/main.ts` → `App.svelte` | Primary workbench |
| Settings window | `settings.html` → `src/settings-main.ts` | Secondary MPA window |
| Tauri | `src-tauri/src/main.rs` | `invoke_handler`, PTY manager |

**On mount, `WorkbenchShell`:**

1. Applies workbench theme from settings (`applyWorkbenchTheme`)
2. Initializes icon theme store (`iconTheme.init()`)
3. Starts project state autosave (`initProjectStateAutosave()`)
4. Registers global keyboard shortcuts

**Vite config:**

- Dev server on port **14200** (configurable via `VITE_PORT`)
- Static assets from `static/` (icon packs at `/icon-packs/...`)
- Code splitting: codemirror, xterm, tauri into separate chunks

---

## 3. Workbench UI Layout

> **Status:** ✅ Complete

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: [ChatTabBar] | [WorkbenchTabBar]                                 │
├──────────────┬──────────────────────────────────────────┬───────────────┤
│              │                                          │               │
│  ChatPane    │  CenterWorkbench                         │ RightSidebar  │
│  (left)      │  - Editor tabs (CodeMirror)              │ - Activity    │
│              │  - Terminal tabs (xterm)                 │   strip       │
│  - Messages  │  - Preview tabs (iframe)                 │ - File tree   │
│  - Tool UI   │                                          │ - Search      │
│  - Input     │  [optional BottomDock: terminal/output]  │ - Git         │
│              │                                          │               │
├──────────────┴──────────────────────────────────────────┴───────────────┤
│ StatusBar: toggle panes, context token meter, settings                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Resizable panes** (persisted in `localStorage` key `tinyllama.paneWidths.v1`):

- Left chat pane: 200–560 px
- Right explorer pane: 200–560 px (or collapsed to 34 px activity strip)
- Bottom dock: 120–560 px

**Module locations:**

| UI Area | Primary Files |
|---------|---------------|
| Shell / layout | `src/modules/workbench/WorkbenchShell.svelte` |
| Chat | `src/modules/agent/ChatPane.svelte`, `ChatTabBar.svelte` |
| Editor / tabs | `src/modules/workbench/CenterWorkbench.svelte`, `WorkbenchTabBar.svelte` |
| Explorer | `src/modules/explorer/RightSidebar.svelte`, `FileTree.svelte`, `FileTreeRow.svelte` |
| Git | `src/modules/explorer/GitPanel.svelte`, `SourceControl.svelte` |
| Settings | `src/modules/settings/SettingsPane.svelte` (modal + popout window) |
| Status bar | `src/modules/workbench/StatusBar.svelte` |

---

## 4. State Management

> **Status:** ✅ Complete

Tiny Llama uses **Svelte writable/derived stores** (not a global Redux-like framework).

### Key Stores

| Store | Location | Persistence |
|-------|----------|-------------|
| `chat` | `src/lib/stores/chat.ts` | `.tinyllama/state.json` |
| `files` | `src/lib/stores/files.ts` | Runtime only |
| `workbench` | `src/lib/stores/workbench.ts` | `localStorage` + `.tinyllama/state.json` |
| `settings` | `src/lib/stores/settings.ts` | `localStorage` (v3) |
| `toolPolicy` | `src/lib/stores/toolPolicy.ts` | `localStorage` (v2) |
| `currentMode` | `src/lib/stores/mode.ts` | Runtime only |
| `iconTheme` | `src/lib/stores/iconTheme.ts` | `localStorage` (v2) |
| `providerUsage` | `src/lib/stores/providerUsage.ts` | `localStorage` (v1) |

### Settings Store (`tinyllama.settings.v3`)

| Field | Description |
|-------|-------------|
| `apiKeys.anthropic`, `apiKeys.openai` | API keys |
| `chatBackend` | `"anthropic"` \| `"ollama"` \| `"llamacpp"` |
| `ollamaEndpoint`, `llamacppEndpoint`, `llamacppApiKey` | Local server URLs |
| `selectedModel`, `ollamaModels`, `llamacppModels` | Active model + discovered lists |
| `anthropicExtendedThinking` | Claude extended thinking stream |
| `anthropicContextBudget` | Optional cap (`null` = full model window) |
| `workbenchTheme` | Theme id |
| `webFetchAllowedHosts` | Hostname allowlist for `web_fetch` |
| `agentLimits` | `maxAgentSteps`, `maxToolCallsPerRun`, `maxToolsPerTurn` |

### Cross-store Coordination

- `projectState.ts` snapshots chat + editor tabs to `.tinyllama/state.json` per workspace
- `filesystemSync.ts` updates `files` + `workbench` after agent filesystem tools
- `workspace.ts` handles folder open, tree building, refresh

---

## 5. AI Chat Subsystem

> **Status:** ✅ Complete

### Chat Modes

| Mode | Tools | Behavior |
|------|-------|----------|
| **Chat** | None (`[]`) | Pure conversation, no file access |
| **Plan** | Read-only tools | Analysis without writes |
| **Agent** | All 16 built-in tools | Full read/write/exec |

Final tool list = **mode tools ∩ effective policy** (denied/removed tools excluded).

### System Prompt Assembly

Built in `ChatPane.svelte` → `buildSystemPrompt()`:

1. **Mode base prompt** (`MODE_CONFIG[mode].basePrompt`)
2. **Workspace context** (`src/lib/agent/workspaceContext.ts`)
3. **Custom instructions** from `.tinyllama/prompt.md`

### Providers

| Backend | File | Protocol |
|---------|------|----------|
| Ollama, llama.cpp | `src/lib/providers/openaiCompat.ts` | `POST /v1/chat/completions` SSE |
| Anthropic | `src/lib/providers/anthropic.ts` | Anthropic Messages API SSE |

### Chat Footer (provider-specific)

| Backend | Left | Right |
|---------|------|-------|
| Ollama | tok/s, tokens, duration | Editable context budget |
| llama.cpp | Same stream metrics | Read-only (`· server`) |
| Anthropic | `X in · Y out this month` | Context estimate (read-only) |

---

## 6. Multi-Turn Tool Calling

> **Status:** ✅ Complete

All orchestration lives in **`runAgentLoop()`** in `ChatPane.svelte`.

### Sequence

```
User message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  FOR step = 0 .. maxAgentSteps (or unlimited):              │
│    1. streamOneTurn(providerMessages, tools)                │
│    2. IF toolCalls.length === 0:                            │
│         save assistant message → EXIT LOOP                  │
│    3. ELSE:                                                 │
│         save assistant message + rawToolCalls               │
│         executeToolCallsWithApproval(toolCalls)             │
│         save tool result messages to chat UI                │
│         CONTINUE to next step                               │
└─────────────────────────────────────────────────────────────┘
```

### Policy Gates

| Rule | Behavior |
|------|----------|
| `allow` | Execute immediately |
| `ask` | Show approval UI; user can Allow, Allow always, or Deny |
| `deny` | Skip execution; return policy error as tool result |

### Configurable Limits

| Setting | Default | Description |
|---------|---------|-------------|
| `maxAgentSteps` | 0 (unlimited) | LLM ↔ tool round trips per user message |
| `maxToolCallsPerRun` | 0 (unlimited) | Total tool executions per message |
| `maxToolsPerTurn` | 0 (unlimited) | Tool calls per model response |

---

## 7. Tool System

> **Status:** ✅ Complete

### Built-in Tools (16)

**Read/Discovery:**
- `read_file`, `list_dir`, `grep`, `find_file`, `get_file_tree`
- `get_git_status`, `get_git_log`, `get_git_diff`
- `web_fetch`

**Write/Execute:**
- `write_file`, `create_file`, `delete_file`, `move_file`
- `run_shell`, `run_tests`, `run_script`

### Default Policy

| Policy | Tools |
|--------|-------|
| `allow` | `read_file`, `write_file`, `create_file`, most read tools |
| `ask` | `move_file`, `delete_file`, `run_shell`, `run_tests`, `run_script`, `web_fetch` |

### Tool Execution Path

```
Model stream → StoredToolCall { id, name, arguments }
    → executeToolCallsWithApproval (policy check)
    → executeTool (toolRunner.ts)
    → ipc.ts invoke(...)
    → Rust commands.rs
    → filesystem.rs / git.rs / shell
    → ToolResult { success, output }
    → appendToolResults → next streamOneTurn
```

### Path Sandboxing

Paths resolved via `src/lib/tools/pathUtils.ts`:
- Workspace sandbox: blocks `..` traversal
- Absolute paths outside workspace rejected
- `/file.txt` treated as workspace-relative

---

## 8. Rust Backend

> **Status:** ✅ Complete

Entry: `src-tauri/src/main.rs`

### Modules

| Module | Responsibility |
|--------|----------------|
| `filesystem.rs` | list/read/write/delete/rename, find files, directory tree, web fetch |
| `git.rs` | git2-based status, diff, stage, unstage, commit, log, branch, discard, checkpoints |
| `pty.rs` | portable-pty sessions; emits `pty:data` and `pty:exit` events |
| `commands.rs` | Tauri command wrappers, grep (spawns `rg`), shell execution |
| `icon_pack.rs` | Resolve bundled/custom icon pack directories |
| `watcher.rs` | File system watching (infrastructure only) |

### IPC Commands

| Category | Commands |
|----------|----------|
| Filesystem | `list_dir`, `read_file`, `write_file`, `rename_entry`, `delete_entry`, `path_exists` |
| Discovery | `find_files`, `list_dir_tree`, `grep_workspace` |
| Shell | `run_shell` |
| Network | `web_fetch` |
| Git | `git_status`, `git_diff`, `git_stage`, `git_unstage`, `git_commit`, `git_log`, `git_branch`, `git_discard`, `git_file_at_head`, `git_create_checkpoint`, `git_restore_checkpoint` |
| Terminal | `pty_create`, `pty_write`, `pty_resize`, `pty_close` |
| Project | `read_system_prompt`, `write_system_prompt`, `read_project_state`, `write_project_state` |
| Window | `pick_workspace_folder`, `pick_icon_pack_folder`, `open_settings_window` |
| Icons | `icon_pack_get_dir`, `icon_pack_refresh_bundled` |

---

## 9. Theming Systems

> **Status:** ✅ Complete

Three independent color systems:

### Workbench Theme (global UI)

- Token sources: `globals.css`, `workbench-themes.css`
- Applied via `data-workbench-theme` attribute on `<html>`
- Presets: `vscode-dark` (default), `cursor-dark`, `catppuccin-mocha`, `tokyo-night`, `one-dark-pro`, `tiny-llama`, `dracula`, `github-dark`

### Key CSS Variables

| Variable Group | Used By |
|----------------|---------|
| `--background`, `--foreground`, `--sidebar-*`, `--border` | Layout chrome |
| `--editor-bg`, `--editor-fg`, `--editor-*` | CodeMirror editor |
| `--terminal-ansi-*` | xterm.js |

---

## 10. File Icons

> **Status:** ✅ Complete

### Icon Themes

| Theme | Resolution |
|-------|------------|
| **Seti** (default) | `resolveSeti.ts` — fileNames → fileExtensions → languageIds → default |
| **VS Code Icons** | `resolve.ts` — SVG assets with embedded colors |
| **Codicons** | Single-tone VS Code icon font |
| **Custom** | User-provided folder with manifest |

Storage key: `tinyllama.iconTheme.v2`

---

## 11. Editor & Syntax

> **Status:** ✅ Complete

### Language Grammars (15)

JavaScript, TypeScript, HTML, CSS, JSON, Markdown, Rust, Python, YAML, Go, C/C++, Java, SQL, XML, Svelte (Vue → HTML fallback)

### Syntax Colors

Custom highlight via `syntaxTheme.ts` + `--syntax-*` CSS variables (Settings → Syntax).

### Git Diff Mode

`OpenFile.diffBase` + line decorations when opened from Git panel; editor read-only in diff mode.

---

## 12. Git Integration

> **Status:** ✅ Complete

### UI (`GitPanel.svelte`)

- Branch display + refresh
- Collapsible **Staged** / **Changes** sections
- File rows: icon, path, status badge (M/A/D/U)
- Click → diff view; hover → Open, Discard, Stage/Unstage
- Commit message + recent log

### Rust Backend (`git.rs`)

| Function | Description |
|----------|-------------|
| `git_status` | List changed, staged, untracked files |
| `git_diff` | Diff against HEAD (optional path filter) |
| `git_stage`, `git_unstage` | Index manipulation |
| `git_commit` | Create commit |
| `git_log` | Recent commits |
| `git_discard` | Restore tracked from HEAD; delete untracked |
| `git_file_at_head` | Content at HEAD for diff base |
| `git_create_checkpoint` | Snapshot as detached commit |
| `git_restore_checkpoint` | Restore from checkpoint |

---

## 13. Terminal (PTY)

> **Status:** ✅ Complete

### Frontend (`TerminalPane.svelte`)

- xterm.js with FitAddon
- Theme from CSS variables (`buildXtermTheme()`)
- Listens to `pty:data` / `pty:exit` Tauri events

### Backend (`pty.rs`)

- `PtyManager` holds sessions keyed by UUID
- `pty_create(cwd?)` spawns shell in workspace or home
- `pty_write`, `pty_resize`, `pty_close`

**Tab integration:** `Alt+Shift+T` or status bar action → `ptyCreate()` → `workbench.addTerminalTab(id)`

---

## 14. Directory Map

```
tiny-llama/
├── docs/
│   ├── architecture/ARCHITECTURE.md  ← this document
│   ├── overview/OVERVIEW.md
│   └── specs/                        ← detailed specifications
├── index.html / settings.html
├── src/
│   ├── App.svelte
│   ├── main.ts / settings-main.ts
│   ├── modules/
│   │   ├── agent/           ChatPane, ChatTabBar
│   │   ├── workbench/       WorkbenchShell, CenterWorkbench, tabs, status bar
│   │   ├── explorer/        File tree, search, git panels
│   │   ├── editor/          EditorSurface (CodeMirror)
│   │   ├── terminal/        TerminalPane (xterm)
│   │   ├── settings/        SettingsPane
│   │   └── shortcuts/       Keyboard dispatcher
│   ├── lib/
│   │   ├── agent/           conversation, streamTurn, workspaceContext
│   │   ├── providers/       openaiCompat, anthropic
│   │   ├── tools/           toolDefinitions, toolRunner, pathUtils
│   │   ├── stores/          chat, files, workbench, settings, toolPolicy, mode, iconTheme
│   │   ├── icon-packs/      Seti/VSCode icon resolution
│   │   ├── editor/          loadCodeMirror, syntaxTheme, diffDecorations
│   │   └── components/      FileIcon, ui primitives
│   └── styles/
│       ├── globals.css
│       └── workbench-themes.css
├── static/icon-packs/       Bundled Seti + vscode-icons assets
├── src-tauri/src/
│   ├── main.rs
│   └── modules/             filesystem, git, pty, commands, icon_pack, watcher
└── tests/unit/              Vitest unit tests
```

---

*Last updated: 2026-05-29. For implementation status, see [Specifications](../specs/README.md).*
