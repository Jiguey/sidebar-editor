# Tiny Llama

A local-first desktop AI coding assistant built with **Tauri 2**, **Svelte 5**, and **CodeMirror 6**. Your code stays on your machine. You pick the model. Nothing phones home.

The privacy moat is real: run Ollama or llama.cpp locally and the only traffic leaving your machine is what you choose to send to a cloud API with your own key. The agent loop, context tracking, and tool execution all run in the desktop webview and Rust backend — no Node sidecar, no required cloud account.

**Hackable:** the shortcut system, tool policy, system prompts, and skills are all user-editable. The spec documents under `docs/specs/` describe every subsystem in detail.

---

## What is implemented now

| Area | Status |
|------|--------|
| Workbench shell (editor, terminal, explorer, git, sidebar) | Shipped |
| Multi-tab chat with session history | Shipped |
| Agent loop with streaming + tool calling | Shipped |
| Ollama, llama.cpp, Anthropic, DeepSeek providers | Shipped |
| 16 built-in agent tools | Shipped |
| Tool policy system (allow / ask / deny) | Shipped |
| Git panel (stage, commit, diff, discard) | Shipped |
| Per-project state persistence (`.tinyllama/`) | Shipped |
| Context budget tracking + breakdown popover | Shipped |
| Context compaction (manual + auto) | Shipped — experimental |
| Compaction archive with restore | Shipped |
| Segmented context bar (system/tools/history) | Shipped |
| Workspace text search (ripgrep) | Shipped |
| Filesystem watcher (explorer + git refresh) | Shipped |
| Editor formatting (wrap, Prettier) | Partial |
| Skills system | Placeholder wired; implementation pending |
| Rust path sandbox (defense in depth) | Planned — TS layer enforces today |
| Workspace lock (multi-window safety) | Planned |
| LSP, inline edit (Cmd+K) | Planned |
| OS keychain for API keys | Planned |

---

## How it works

Every user message in **Agent** or **Plan** mode drives a loop:

```
User message
  → build system prompt (mode + workspace + prompts + skills)
  → build provider message history
  → [optional] auto-compact if context threshold exceeded
  → stream one model turn (text + tool calls)
  → run tools through policy gates (allow / ask / deny)
  → append tool results to history
  → repeat until model stops, step limit hit, or context budget exceeded
  → refresh explorer / editor / git panel after filesystem changes
```

Data flow:

```
Svelte UI  →  lib/providers/*  →  HTTP fetch to LLM APIs
           →  lib/tools/toolRunner.ts  →  lib/ipc.ts  →  Tauri invoke
Rust       →  filesystem, git, grep, shell, web_fetch, PTY
```

There is no Node.js sidecar at runtime. Node is used only during build (Vite, Vitest, Tauri CLI).

---

## Providers

| Provider | Protocol | Streaming | Context window |
|----------|----------|-----------|----------------|
| **Ollama** | OpenAI-compatible `/v1/chat/completions` | SSE | Configurable per model (`num_ctx`); editable in the chat footer |
| **llama.cpp** | OpenAI-compatible (`llama-server`) | SSE | Set per model in provider settings |
| **Anthropic** | Anthropic Messages API | SSE | Model max; optional budget cap |
| **DeepSeek** | OpenAI-compatible | SSE | Chat and Reasoner models from catalog |

All providers stream tokens into the chat pane in real time. Local providers (Ollama, llama.cpp) show tok/s and time-to-first-token in the footer. Anthropic tracks cumulative input/output tokens.

**Models without native tool support:** some local models emit tool calls as plain text. The app recovers them via `textToolCalls.ts` and can run a synthesis pass for a final natural-language summary after tool-heavy turns.

---

## Agent tools

16 built-in tools grouped by category:

| Category | Tools |
|----------|-------|
| **Files** | `read_file` — read a file's contents; `write_file` — overwrite a file; `create_file` — create a new file; `delete_file` — delete a file; `rename_file` — rename or move a file; `list_directory` — list directory contents; `find_file` — find files by name pattern; `get_file_tree` — get the workspace file tree (gitignore-filtered) |
| **Git** | `get_git_status` — staged/unstaged changes; `get_git_log` — recent commit history; `get_git_diff` — file or workspace diff |
| **Shell** | `run_shell` — run a shell command; `run_tests` — run the project's test suite; `run_script` — run a named script from `package.json` |
| **Network** | `web_fetch` — fetch a URL (hostname allowlist enforced) |

All tools run inside the opened workspace. Paths are sandboxed by `pathUtils.ts` — `..` traversal and paths outside the project root are rejected before reaching Rust.

### Tool policy

Three policies apply per tool, configurable globally in Settings and per-project in `.tinyllama/tools.json`:

| Policy | Behavior |
|--------|----------|
| **allow** | Executes immediately |
| **ask** | Shows an approval prompt above the composer |
| **deny** | Skipped; error returned to the model |

Defaults lean toward **allow** for reads and **ask** for writes and shell. The effective tool list sent to the model is `mode tools ∩ allowed tools` — denied tools are removed from the schema entirely.

### Agent limits

Configurable in Settings (0 = unlimited):

| Setting | Meaning |
|---------|---------|
| `maxAgentSteps` | Max model ↔ tool round trips per message |
| `maxToolCallsPerRun` | Total tool executions per message |
| `maxToolsPerTurn` | Tool calls allowed in a single model response |

---

## Context and compaction

### Segmented context bar

The chat footer shows a 3px bar divided into three segments:

- **Purple** — system prompt (base mode, workspace context, tool instructions, prompts, skills)
- **Orange** — tool schemas (native tool call mode only)
- **Blue** — chat history

Hover the bar to see a breakdown popover with per-section token counts, total used, context window size, and reply reserve.

### Compaction

When the context fills up, compaction summarizes old messages into a compact block and preserves the last N raw turns. Instead of silently dropping history:

1. A slice of history (first turn + last 20 messages) is sent to a summary model
2. The summary is structured markdown: original task, what was done, current state, files touched
3. History is replaced with a synthetic user/assistant pair wrapping the summary
4. The last `compactKeepRecentTurns` raw messages (default 6) are appended unchanged

**Archive and restore:** the full pre-compaction message list is saved as `preCompactionMessages` on the session. The compaction divider in the chat shows "N archived messages · Restore full context". Clicking "Restore full context" reverts the session to its pre-compaction state — one level of undo.

**Settings** (Settings → Compaction): master switch, summary model picker, auto-compaction threshold (50–95%, default 85%), keep-last-N raw turns (2–20).

---

## Skills

Skills are context fragments — small markdown documents injected into the system prompt when certain workspace conditions are met. A React skill activates when `react` is in `package.json`; a Rust skill activates when `Cargo.toml` is present.

**Current state:** the `assemble.ts` slot for skills is wired. `src/lib/skills/` is empty — the bundled skill pack and the skills UI are not yet implemented. The design is in [Spec 30](docs/specs/30-agent-context-and-model-settings.md).

**Planned:**
- Skills panel in Settings → Agent Context → Skills
- Auto-activation signals (file presence, package.json deps, config files)
- Bundled starter pack (Node/TS, React, Svelte, Rust, Python, Docker, Git Conventions)
- Per-project skills committed with the repo (`.tinyllama/skills/`)
- Global skills (`~/.tinyllama/skills/`)
- Variable interpolation: `{{workspace_name}}`, `{{git_branch}}`, `{{active_file}}`, etc.

---

## Git integration

The git panel is the primary surface for reviewing what the agent changed:

- **Staged** and **Changes** sections with M/A/D/R status badges
- Click a file → diff view in the editor (decorations vs HEAD)
- Stage, unstage, commit with a message, discard changes
- Hover actions on file rows for quick stage/discard

Agent tools that mutate files (`write_file`, `create_file`, `delete_file`, `rename_file`) trigger an automatic git panel refresh. Git tools (`get_git_status`, `get_git_log`, `get_git_diff`) are read-only and available in Plan and Agent modes.

**Chat rewind:** before sending a message, the app can snapshot the git tree (checkpoint). Rewinding a message restores the workspace to that checkpoint and truncates chat history from that point.

---

## Configuration

### Global settings

Stored in `localStorage` under `tinyllama.settings.v4`:

- Provider endpoints, API keys, model lists with per-model context window and tool call settings
- Workbench theme, icon theme, syntax/editor/chat appearance
- Tool policy defaults and web fetch hostname allowlist
- Agent limits, compaction settings, model role assignments
- Anthropic extended thinking and context budget cap

Optional environment variable fallbacks: see `.env.example`.

### Per-project files (`.tinyllama/`)

| Path | Purpose |
|------|---------|
| `.tinyllama/state.json` | Chat sessions, history, editor tabs — autosaved |
| `.tinyllama/prompts/*.md` | Per-mode or shared system prompt files |
| `.tinyllama/prompts.json` | Prompt manifest — enable/disable and mode scope |
| `.tinyllama/tools.json` | Tool policy overrides and custom tool schemas |
| `.tinyllama/skills/` | Project-scoped skill directories (planned) |
| `.tinyllama/skills-config.json` | Per-workspace skill activation overrides (planned) |
| `.tinyllama/prompt.md` | Legacy single prompt — auto-migrated to `prompts/agent.md` |

Secrets stay in local settings or environment variables — not committed to the repo. See [Security spec](docs/specs/14-security.md).

---

## Development quick start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Rust 1.70+
- [Tauri 2 platform dependencies](https://tauri.app/start/prerequisites/)

**Linux (Arch):**

```bash
sudo pacman -S webkit2gtk-4.1 base-devel curl wget openssl gtk3 libayatana-appindicator librsvg libvips
```

### Running

```bash
pnpm install

# Full desktop app (Tauri + Svelte — required for tools, git, terminal)
pnpm tauri dev

# Frontend only (UI work without Rust — tools, git, PTY will not work)
pnpm dev
```

Dev server port: **14200** (set in `vite.config.ts`).

---

## Testing

```bash
# Unit tests (Vitest)
pnpm test

# LLM eval harness (requires Ollama running with a model pulled)
pnpm eval

# Run a specific eval suite
pnpm eval -- --suite 08-agent-files

# Run a specific eval test
pnpm eval -- --test agent-files-01

# Open the latest eval report
pnpm eval:report
```

The eval harness (`tests/llm/`) runs all three modes (Chat, Plan, Agent) against a real Ollama model. Full run against a 27B model takes 30–90 minutes. Results write to `tests/llm/results/` (gitignored). See [Spec 31](docs/specs/31-llm-eval-harness.md) for the full harness design.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Svelte frontend (src/)                                        │
│  WorkbenchShell · ChatPane · Editor · Terminal · GitPanel    │
│  Stores: chat, files, settings, toolPolicy, mode, ...        │
│  lib/providers/*  →  fetch() to LLM APIs                     │
│  lib/tools/*      →  ipc.ts → Tauri commands                 │
└────────────────────────────┬─────────────────────────────────┘
                             │ invoke() + events (pty:data, fs:changed, ...)
┌────────────────────────────▼─────────────────────────────────┐
│ Rust backend (src-tauri/src/)                                 │
│  filesystem · git · pty · grep · shell · web_fetch           │
└──────────────────────────────────────────────────────────────┘
```

- **Two-tier runtime:** Svelte agent loop + Rust IPC. No Node sidecar.
- **LLM HTTP:** `fetch()` from the webview directly to provider APIs. No Rust proxy.
- **Filesystem watcher:** `watcher.rs` → debounced `fs:changed` events → tree + git refresh in the UI.

Deep dive: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) · [Specifications index](docs/specs/README.md)

---

## Roadmap

What is not built yet, in rough priority order:

| Area | Status | Spec |
|------|--------|------|
| Skills system (bundled pack + UI) | Planned | [30](docs/specs/30-agent-context-and-model-settings.md) |
| Agent error recovery (retries, continue after step limit) | Planned | [32](docs/specs/32-agent-error-recovery.md) |
| Rust path enforcement (symlink escape hardening) | Planned | [33](docs/specs/33-rust-path-enforcement.md) |
| Context overflow warnings (amber/red bar states) | Planned | [34](docs/specs/34-context-overflow-warnings.md) |
| Workspace lock (multi-window safety) | Planned | [35](docs/specs/35-workspace-lock.md) |
| First-run / onboarding empty states | Planned | [36](docs/specs/36-first-run-onboarding.md) |
| Shortcut rebinding UI | Planned | [37](docs/specs/37-shortcut-rebinding.md) |
| Parallel tool execution | Planned | [38](docs/specs/38-parallel-tool-execution.md) |
| File-backed planning system (`plans/`) | Planned | [19](docs/specs/19-planning-system.md) |
| Inline edit / Cmd+K | Planned | [28](docs/specs/28-inline-edit-autocomplete.md) |
| LSP diagnostics (TypeScript, etc.) | Planned | [25](docs/specs/25-lsp-diagnostics.md) |
| OS keychain for API keys | Planned | [14](docs/specs/14-security.md) |

Full roadmap with phasing: [docs/specs/17-roadmap.md](docs/specs/17-roadmap.md).

---

## License

MIT
