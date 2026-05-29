# Not Yet Implemented

> **Tracker for spec’d work that is not done in the codebase yet.**  
> Last reviewed: 2026-05-29  
> **Authoritative detail:** [docs/specs/README.md](docs/specs/README.md) and linked spec files.

Use this file when prioritizing work. When something ships, update the relevant spec, [docs/specs/17-roadmap.md](docs/specs/17-roadmap.md), and remove or mark it here.

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| ❌ | Not started |
| 🔶 | Partially implemented (gaps listed) |
| 📋 | Spec / roadmap only |

---

## Summary

| Area | Status | Primary spec |
|------|--------|----------------|
| Planning system (`plans/`) | ❌ | [19-planning-system.md](docs/specs/19-planning-system.md) |
| Editor: Prettier, wrap, full colors | ❌ | [20-editor-formatting-and-theming.md](docs/specs/20-editor-formatting-and-theming.md) |
| Editor core | 🔶 | [10-editor.md](docs/specs/10-editor.md) |
| Security hardening | 🔶 | [14-security.md](docs/specs/14-security.md) |
| Trust & reliability (Phase B) | ❌ | [17-roadmap.md](docs/specs/17-roadmap.md) |
| v1.0 parity (LSP, Cmd+K, providers, …) | ❌ | [17-roadmap.md](docs/specs/17-roadmap.md) |
| Agent / tools (remaining Phase A items) | ❌ | [08-ai-agent.md](docs/specs/08-ai-agent.md), [09-tool-system.md](docs/specs/09-tool-system.md) |

---

## Whole specifications not implemented

These have dedicated spec documents where **everything** (or nearly everything) is still ❌:

### [19 — Planning system](docs/specs/19-planning-system.md)

Persistent `plans/*.md` (4-field frontmatter + GFM checkboxes). Plan mode: read repo, write **`plans/**` only**; UI plan picker (not model-chosen); `ChatSession.activePlanPath`; agent handoff in Agent mode. No specialized plan tools in v1.

| Phase | Item | Status |
|-------|------|--------|
| **1** | `src/lib/plans.ts` parser + index/active injection + `plans/**` write gate + `activePlanPath` | ❌ |
| **2** | `PlanPicker.svelte`, chat header indicator, explorer status dots | ❌ |
| **3** | Agent write-back (checkboxes, `updated`, implement flow) | ❌ |
| **4** | Reconcile pass, show-all picker, edge cases, `plans/README.md` | ❌ |

### [20 — Editor formatting & theming](docs/specs/20-editor-formatting-and-theming.md)

| Item | Status |
|------|--------|
| **Line wrap** (`editor.wordWrap` + CodeMirror `lineWrapping`) | ❌ |
| **Prettier** — format document, format on save | ❌ |
| **Full syntax colors in Settings** — heading, link, emphasis, strong, meta, punctuation, default, invalid | ❌ |
| **Editor chrome in Settings** — bg, fg, gutter, selection, cursor, active line | ❌ |
| **Markdown syntax preview** in Settings | ❌ |
| Fix `.md` highlighting (stop aliasing markdown tokens to other keys) | ❌ |
| `syntaxColors` storage v2 migration | ❌ |
| Theme export/import JSON (optional) | ❌ |

---

## Partial implementations (finish these)

### Editor & syntax — [10-editor.md](docs/specs/10-editor.md), [13-theming.md](docs/specs/13-theming.md)

| Done today | Still missing |
|------------|----------------|
| CodeMirror 6, 15 grammars, diff mode | Line wrap |
| 9 syntax color fields in Settings | All markdown-oriented tokens editable |
| `--syntax-*` CSS + live apply | Editor chrome colors user-editable |
| | Prettier |
| | TOML / shell grammars (optional; listed as not loaded) |

### Security — [14-security.md](docs/specs/14-security.md)

| Done today | Still missing |
|------------|----------------|
| Tool path sandbox in TypeScript | Rust workspace path enforcement on FS IPC |
| API keys in `localStorage` | OS keychain (Stronghold) |
| LLM `fetch` in webview | LLM HTTP in Rust + stream events |
| Plain-text chat (no HTML XSS) | Production CSP in `tauri.conf.json` |
| | DOMPurify if rich markdown HTML in chat |

### Git — [11-git.md](docs/specs/11-git.md)

| Done today | Still missing |
|------------|----------------|
| Status, stage, commit, diff, discard | Checkpoint **UI** (Rust `git_create_checkpoint` exists) |
| | Agent turn undo (batch discard / snapshot) |

### IPC / workspace — [12-ipc.md](docs/specs/12-ipc.md), [07-workspace.md](docs/specs/07-workspace.md)

| Done today | Still missing |
|------------|----------------|
| Full command set for FS, git, PTY | Wire `fs:changed` → `filesystemSync` |
| `watcher.rs` module present | Workspace lock (multi-window `state.json`) |

### AI agent — [08-ai-agent.md](docs/specs/08-ai-agent.md)

| Done today | Still missing |
|------------|----------------|
| Agent loop, streaming, tool approval, limits | Parallel read-only tools |
| Provider footers, context meter | Context overflow warnings in meter |
| | Agent error recovery (retry, cancel cleanup, continue after max) |
| | Context compaction / sliding window |

### Tool system — [09-tool-system.md](docs/specs/09-tool-system.md)

| Done today | Still missing |
|------------|----------------|
| 16 built-in tools, policy | Filter custom tools without handlers from schema |
| | Parallel read-only tool execution |
| | Rust path canonicalization (duplicate of security) |

---

## Roadmap backlog (by phase)

From [docs/specs/17-roadmap.md](docs/specs/17-roadmap.md).

### Phase A — Dogfooding (remaining)

| Item | Spec |
|------|------|
| Parallel read-only tools | [08](docs/specs/08-ai-agent.md), [09](docs/specs/09-tool-system.md) |
| Context overflow warnings + API usage in meter | [08](docs/specs/08-ai-agent.md) |
| Filter custom tools without handlers | [09](docs/specs/09-tool-system.md) |
| Planning system | [19](docs/specs/19-planning-system.md) |
| Editor wrap + markdown/syntax colors | [20](docs/specs/20-editor-formatting-and-theming.md) |
| Prettier | [20](docs/specs/20-editor-formatting-and-theming.md) |

### Phase B — Trust and reliability (pre–private beta)

| Item | Spec |
|------|------|
| Rust workspace path enforcement | [14](docs/specs/14-security.md), [12](docs/specs/12-ipc.md) |
| Agent error recovery | [08](docs/specs/08-ai-agent.md) |
| Workspace lock | [07](docs/specs/07-workspace.md) |
| File watcher → UI | [07](docs/specs/07-workspace.md), [12](docs/specs/12-ipc.md) |
| Agent turn undo | [11](docs/specs/11-git.md), [08](docs/specs/08-ai-agent.md) |

### Phase C — Security (before external users)

| Item | Spec |
|------|------|
| Stronghold / keychain for API keys | [14](docs/specs/14-security.md) |
| LLM calls in Rust | [14](docs/specs/14-security.md), [03](docs/specs/03-architecture.md) |
| Production CSP | [14](docs/specs/14-security.md) |

### Phase D — v1.0 parity (selective)

| Item | Spec |
|------|------|
| LSP (language servers from Rust) | [01](docs/specs/01-product.md), [10](docs/specs/10-editor.md) |
| Cmd+K inline edit | [01](docs/specs/01-product.md), [10](docs/specs/10-editor.md) |
| DeepSeek, Mistral, Perplexity providers | [17](docs/specs/17-roadmap.md) |
| Custom tool shell executor (`.tinyllama` templates) | [17](docs/specs/17-roadmap.md) |
| Context compaction | [08](docs/specs/08-ai-agent.md), [17](docs/specs/17-roadmap.md) |
| Full provider billing APIs | [17](docs/specs/17-roadmap.md) |

---

## Explicitly deferred (not on the implementation list)

These are **intentionally** out of scope per [01-product.md](docs/specs/01-product.md) and [17-roadmap.md](docs/specs/17-roadmap.md):

- Multi-root workspaces  
- Cloud sync / accounts  
- Browser / mobile as primary product  
- Node sidecar / Pi harness (removed; not coming back)  
- Matching Cursor feature-for-feature  

---

## Implemented spec documents (for reference)

These specs are **complete** relative to current code; do not treat them as backlog:

| Spec | Topic |
|------|--------|
| [01-product](docs/specs/01-product.md) | Product / non-goals |
| [02-technology](docs/specs/02-technology.md) | Stack |
| [03-architecture](docs/specs/03-architecture.md) | Runtime architecture |
| [04-entry-points](docs/specs/04-entry-points.md) | Windows / bootstrap |
| [05-workbench](docs/specs/05-workbench.md) | Layout |
| [06-state-management](docs/specs/06-state-management.md) | Stores |
| [07-workspace](docs/specs/07-workspace.md) | Project lifecycle *(minus items above)* |
| [08-ai-agent](docs/specs/08-ai-agent.md) | Agent loop *(core done; see partial)* |
| [09-tool-system](docs/specs/09-tool-system.md) | Tools *(core done; see partial)* |
| [11-git](docs/specs/11-git.md) | Git UI *(minus checkpoint UI / undo)* |
| [12-ipc](docs/specs/12-ipc.md) | IPC *(minus watcher / path sandbox)* |
| [15-testing](docs/specs/15-testing.md) | Tests |
| [16-build](docs/specs/16-build.md) | Build |
| [18-glossary](docs/specs/18-glossary.md) | Terms |

Also see [docs/overview/OVERVIEW.md](docs/overview/OVERVIEW.md) and [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for current behavior.

---

## Suggested priority (opinionated)

1. **Editor Phase A** — wrap + markdown syntax colors ([20](docs/specs/20-editor-formatting-and-theming.md)) — high daily-use impact  
2. **Phase B security path** — Rust workspace enforcement ([14](docs/specs/14-security.md))  
3. **Planning system MVP** — `plans/` + Plan mode ([19](docs/specs/19-planning-system.md))  
4. **Prettier** — format on save ([20](docs/specs/20-editor-formatting-and-theming.md))  
5. **File watcher → UI** — external edits refresh explorer ([12](docs/specs/12-ipc.md))  

---

*Maintainers: when closing an item, delete or strike it here and set the spec section to ✅.*
