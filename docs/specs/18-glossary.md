# Glossary

> **Status:** ✅ **COMPLETE**

---

## Terms

| Term | Meaning |
|------|---------|
| **Workspace** | Root folder opened by the user; same as "project" |
| **Project** | Root folder opened by the user; same as "workspace" |
| **Agent step** | One `streamOneTurn` call + execution of returned tool calls |
| **Agent loop** | The full cycle from user message to final assistant response |
| **Tool call run** | All steps for a single user message until stop or limit |
| **Tool call** | Single invocation of a tool by the model |
| **Diff mode** | Editor showing working tree with highlights vs `diffBase` (HEAD) |
| **Provider** | LLM backend service (Anthropic, Ollama, llama.cpp) |
| **Provider usage** | Local monthly token tallies from API responses |
| **Context budget** | Maximum tokens for a conversation (model window or custom limit) |
| **Tool policy** | Rules governing tool execution (`allow`, `ask`, `deny`) |
| **Effective policy** | Merged result of global settings + project `.tinyllama/tools.json` |
| **Mode** | Chat mode determining available tools (Chat, Plan, Agent) |
| **Session** | A single chat conversation with message history |
| **Checkpoint** | Git snapshot for potential rollback (detached commit) |
| **Plan file** | Markdown under `plans/` with YAML frontmatter (specified, not implemented) |
| **Plan index** | Summary of plan files injected into Plan mode context (specified, not implemented) |
| **Active plan** | Session-bound plan path (`activePlanPath`; specified, not implemented) |
| **Activity plan row** | In-chat `planText` in agent turn UI — not a plan file |
| **Sidecar** | *(Removed)* Former Node process for agent/harness — **not used**; see [03-architecture.md](03-architecture.md#former-sidecar-design-removed) |
| **Harness** | *(Removed)* Former Tauri IPC + sidecar event protocol — replaced by webview agent loop |
| **Syntax colors** | Editor token colors via `--syntax-*` CSS vars; partial Settings UI today |
| **Editor chrome** | Editor shell colors (`--editor-bg`, gutter, selection) — workbench preset today |

---

## File Locations

| Path | Description |
|------|-------------|
| `.tinyllama/` | Project-local configuration directory |
| `.tinyllama/prompt.md` | Custom system prompt additions |
| `.tinyllama/tools.json` | Project tool rules and custom tools |
| `.tinyllama/state.json` | Persisted chat sessions and editor tabs |
| `tinyllama.settings.v3` | localStorage key for global settings |
| `tinyllama.toolPolicy.v2` | localStorage key for global tool policy |
| `tinyllama.iconTheme.v2` | localStorage key for icon theme selection |
| `tinyllama.providerUsage.v1` | localStorage key for monthly usage |
| `tinyllama.paneWidths.v1` | localStorage key for pane dimensions |

---

## Abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| IPC | Inter-Process Communication (Tauri invoke) |
| PTY | Pseudo-Terminal |
| SSE | Server-Sent Events |
| CSP | Content Security Policy |
| LSP | Language Server Protocol |
| MPA | Multi-Page Application |

---

## Status Indicators

| Indicator | Meaning |
|-----------|---------|
| ✅ Complete | Feature implemented and tested |
| 🔶 Partial | Some components implemented |
| 🚧 In Progress | Currently being worked on |
| 📋 Active | Living document (roadmap) |
| ❌ Not Started | Planned but not implemented |
