# Roadmap

> **Status:** 📋 **ACTIVE** — Living document tracking phased priorities.

---

## Phase Overview

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase A** | Dogfooding | ✅ Mostly complete |
| **Phase B** | Trust and reliability | 🚧 Planning |
| **Phase C** | Security | ❌ Not started |
| **Phase D** | v1.0 parity | ❌ Not started |

---

## Phase A — Dogfooding (In Progress / Recent)

| Item | Status | Notes |
|------|--------|-------|
| Configurable agent limits (steps, tool calls) | ✅ Done | Settings → Tools |
| Provider-specific chat footer | ✅ Done | Ollama/llama.cpp/Anthropic variants |
| Monthly API usage tracking (Anthropic) | ✅ Done | `providerUsage` store |
| Git panel redesign + discard + diff view | ✅ Done | Full implementation |
| Expanded syntax grammars + custom syntax colors | ✅ Done | 15 languages |
| Per-project `state.json` (chat + editor tabs) | ✅ Done | `.tinyllama/state.json` |
| Parallel read-only tools | ❌ Planned | Optimization |
| Context overflow warnings + API usage in meter | ❌ Planned | UX improvement |
| Filter custom tools without handlers | ❌ Planned | Tool system cleanup |
| **Planning system** (`plans/` + file-backed Plan mode) | ❌ Spec ready | [19-planning-system.md](19-planning-system.md) |
| **Editor wrap + syntax/markdown colors** | ❌ Spec ready | [20-editor-formatting-and-theming.md](20-editor-formatting-and-theming.md) |
| **Prettier (format document / on save)** | ❌ Spec ready | [20-editor-formatting-and-theming.md](20-editor-formatting-and-theming.md) |

---

## Phase B — Trust and Reliability (Pre–Private Beta)

| Item | Status | Notes |
|------|--------|-------|
| Rust workspace path enforcement | ❌ Not started | All path-taking FS IPC |
| Agent error recovery | ❌ Not started | Retry, cancel cleanup, Continue after max steps |
| Workspace lock | ❌ Not started | Prevent two windows corrupting `state.json` |
| File watcher → UI | ❌ Not started | Wire `watcher.rs` to `filesystemSync` |
| Agent turn undo | ❌ Not started | Snapshot or git-based batch discard |
| **Context compaction** | ❌ Spec ready | [21-context-compaction.md](21-context-compaction.md) — auto + manual, editable threshold % |

---

## Phase C — Security (Before External Users)

| Item | Status | Notes |
|------|--------|-------|
| Stronghold / keychain | ❌ Not started | Keys never in JS |
| LLM calls in Rust | ❌ Not started | `reqwest` + stream events |
| Production CSP | ❌ Not started | `tauri.conf.json` |

---

## Phase D — v1.0 Parity (Selective)

| Item | Status | Notes |
|------|--------|-------|
| LSP | ❌ Not started | Spawn language servers from Rust |
| Cmd+K inline edit | ❌ Not started | CodeMirror decorations |
| DeepSeek | ✅ | `deepseek` chat backend; Settings → DeepSeek |
| Mistral, Perplexity | ❌ Not started | OpenAI-compat + provider registry |
| Custom tool shell executor | ❌ Not started | Optional `.tinyllama` command templates |
| Context compaction | ❌ Spec ready | [21-context-compaction.md](21-context-compaction.md) — not sliding window |
| Full provider billing APIs | ❌ Not started | Beyond local monthly estimates |

---

## Explicitly Deferred

| Item | Reason |
|------|--------|
| Multi-root workspaces | Complexity; single folder per window sufficient |
| Cloud sync | Local-first philosophy |
| Mobile / web deployment | Desktop-focused product |
| Matching Cursor feature-for-feature | Different scope and goals |

---

## Recent Completions (2026)

| Date | Item |
|------|------|
| 2026-05 | Git checkpoint infrastructure (Rust backend) |
| 2026-05 | Provider server config templates |
| 2026-05 | Chat appearance customization |
| 2026-05 | Agent activity feed |
| 2026-05 | Text tool calls display |
| 2026-05 | Streaming status word |
| 2026-05 | Chat rewind functionality |
| 2026-04 | Agent synthesis |
| 2026-04 | Context budget system |

---

## Contributing

When adding new roadmap items:

1. Add to appropriate phase
2. Include brief notes
3. Update status as work progresses
4. Move to "Recent Completions" when done
