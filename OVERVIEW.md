# Tiny Llama — Application Overview

Tiny Llama is a minimal, Cursor-inspired desktop IDE with an integrated AI chat assistant. It combines a **Svelte 5** frontend with a **Rust/Tauri 2** backend for OS integration.

The product goal is a lightweight coding workbench (editor, explorer, terminal, git, chat) with swappable AI backends and a local tool runtime—no Node sidecar.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Desktop Shell** | Tauri 2, `@tauri-apps/api`, `tauri-plugin-shell` |
| **Frontend** | Svelte 5, Vite 6, TypeScript, Tailwind CSS 4 |
| **UI Components** | bits-ui, shadcn-svelte-style primitives, Lucide icons, VS Code codicons |
| **Editor** | CodeMirror 6 (JS/TS, Rust, Python, Markdown, etc.) |
| **Terminal** | xterm.js + `@xterm/addon-fit` |
| **Rust Backend** | serde, git2, portable-pty, notify, rfd, walkdir, reqwest |
| **AI Providers** | Direct fetch to Ollama, LM Studio, llama.cpp (OpenAI-compatible), Anthropic |
| **Testing** | Vitest (unit + optional Ollama integration) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Svelte UI (src/)                                                │
│  WorkbenchShell → ChatPane | CenterWorkbench | RightSidebar      │
│                                                                  │
│  src/lib/providers/     Direct fetch to AI APIs                 │
│  src/lib/agent/         Multi-turn tool loop + message history  │
│  src/lib/tools/         Tool definitions & runner → Tauri IPC   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Tauri invoke + events
┌───────────────────────────▼─────────────────────────────────────┐
│  Rust Backend (src-tauri/src/)                                   │
│  filesystem, git, pty, grep, shell, find_files, web_fetch         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### AI Chat with Mode System

| Mode | Tools | Description |
|------|-------|-------------|
| **Chat** | None | Pure conversation |
| **Plan** | Read-only set | Analysis without writes |
| **Agent** | All builtins | Full implementation |

**Providers:** Ollama, llama.cpp (OpenAI-compatible), Anthropic Claude.

**Agent loop:** Up to 12 turns per user message—stream → tool calls → execute (with approval) → feed tool results back → stream again until the model stops calling tools.

**Tool policy (global):** Per-tool `allow` | `ask` | `deny`, stored in `localStorage` (`tinyllama.toolPolicy.v2`). Defaults: allow most tools; **ask** for `move_file`, `delete_file`, `run_shell`, `run_tests`, `run_script`, `web_fetch`.

**Project overrides:** `.tinyllama/tools.json` can set `toolRules` and `customTools`; merged at runtime with global policy (Settings UI remains global-only).

**System prompt:** `.tinyllama/prompt.md` appended to the mode base prompt.

### Builtin Tools (16)

| Tool | Backend | Notes |
|------|---------|--------|
| `read_file`, `write_file`, `create_file`, `delete_file`, `move_file` | filesystem | Workspace-sandboxed paths |
| `list_dir`, `grep`, `find_file`, `get_file_tree` | filesystem / ripgrep / walkdir | Discovery |
| `get_git_status`, `get_git_log`, `get_git_diff` | git2 | |
| `run_shell`, `run_tests`, `run_script` | shell | Tests auto-detect npm/cargo/pytest |
| `web_fetch` | reqwest | Host allowlist in Settings |

Custom tools defined in Settings are schema-only until a handler is added in `toolRunner.ts`.

### Code Editor, Explorer, Git, Terminal

- CodeMirror 6 multi-tab editor with save via Tauri
- File tree via `list_dir` (gitignore-aware)
- Git panel: status, stage, commit, log, diff
- PTY terminal in workbench tabs or bottom dock

---

## Chat Flow

1. User sends a message (added to session history).
2. `buildProviderMessages()` converts session history (user / assistant with `tool_calls` / tool results) for the provider.
3. `streamOneTurn()` streams one model response.
4. If no tool calls → assistant message saved, done.
5. If tool calls → approval gate where policy is `ask` → `executeTool()` → tool messages saved → loop to step 3.

---

## Configuration

### Global settings (`tinyllama.settings.v3`)

Providers, API keys, models, theme, **web fetch allowed hosts** (one hostname per line).

### Project files

| Path | Purpose |
|------|---------|
| `.tinyllama/prompt.md` | Custom system instructions |
| `.tinyllama/tools.json` | Per-project tool rules and custom tool definitions |

Example `tools.json`:

```json
{
  "toolRules": {
    "run_shell": "deny",
    "grep": "allow"
  },
  "customTools": [
    {
      "name": "deploy",
      "description": "Deploy to staging",
      "rule": "ask",
      "parametersJson": "{\"type\":\"object\",\"properties\":{}}"
    }
  ]
}
```

---

## IPC Commands (selected)

| Command | Purpose |
|---------|---------|
| `list_dir`, `read_file`, `write_file`, `find_files`, `list_dir_tree` | Filesystem |
| `grep_workspace`, `run_shell`, `web_fetch` | Search / shell / HTTP |
| `git_*` | Git operations |
| `read_system_prompt`, `write_system_prompt` | Prompt file |
| `pty_*` | Terminal |

---

## Development

```bash
npm install
npm run tauri dev   # desktop app (not plain npm run dev)
npm test            # Vitest unit tests
```

---

## Directory Structure (high level)

```
src/
  modules/agent/       ChatPane, agent UI
  modules/workbench/   Shell, tabs, status bar
  lib/agent/           conversation.ts, streamTurn.ts
  lib/providers/       openaiCompat.ts, anthropic.ts
  lib/tools/           toolDefinitions.ts, toolRunner.ts
  lib/stores/          settings, chat, toolPolicy, mode
src-tauri/src/modules/
  filesystem.rs, git.rs, pty.rs, commands.rs
tests/unit/            Vitest
```
