# Security and Secrets

> **Status:** 🔶 **PARTIAL** — Basic security in place; hardening planned.

See also: `docs/SECRETS.md` (if exists)

---

## Current State

| Topic | Current Implementation | Status |
|-------|------------------------|--------|
| API keys | `localStorage` v3 | 🔶 Working but not ideal |
| LLM HTTP | Webview `fetch` | ✅ Working |
| CSP | `null` in `tauri.conf.json` | 🔶 Permissive |
| Path sandbox | TS tools only (`pathUtils.ts`) | 🔶 Partial |
| Chat XSS | Plain text messages (no markdown HTML) | ✅ Safe |

---

## API Key Storage

### Current

- Stored in `localStorage` under key `tinyllama.settings.v3`
- Accessible to any JavaScript in the webview
- Cleared on localStorage clear

### Planned

- OS keychain via **Stronghold** plugin
- Keys never touch JavaScript
- Secure retrieval only for LLM calls

---

## LLM HTTP Calls

### Current

- Direct `fetch()` from webview to provider APIs
- API keys included in Authorization headers
- Keys visible in browser dev tools

### Planned

- LLM calls in Rust via `reqwest`
- Stream responses via Tauri events
- Keys remain in Rust memory only

---

## Path Sandboxing

### Current (TypeScript)

`src/lib/tools/pathUtils.ts`:
- Blocks `..` traversal attempts
- Rejects absolute paths outside workspace
- Treats `/file.txt` as workspace-relative

### Current (Rust)

- `read_file` / `write_file` accept any path OS allows
- No workspace enforcement at Rust layer

### Planned

- Canonicalize all paths against workspace root in Rust
- Reject paths outside workspace in `filesystem.rs`

---

## Content Security Policy

### Current

```json
// tauri.conf.json
"csp": null
```

Permissive CSP allows:
- Connections to any origin (provider APIs)
- Inline styles and scripts

### Planned

- Restrictive CSP for release builds
- Explicit allowlist for provider domains
- No inline scripts/styles

---

## Chat Content Safety

### Current

- Messages rendered as plain text
- No HTML parsing or rendering
- Tool outputs escaped

### If Markdown Added

- Use DOMPurify for sanitization
- Whitelist safe tags only
- No raw HTML in messages

---

## Roadmap

| Item | Priority | Status |
|------|----------|--------|
| Rust workspace path enforcement | Phase B | ❌ Not started |
| OS keychain (Stronghold) | Phase C | ❌ Not started |
| LLM calls in Rust | Phase C | ❌ Not started |
| Production CSP | Phase C | ❌ Not started |
| DOMPurify (if markdown) | As needed | ❌ Not started |

---

## Security Considerations

### Model Context

- User messages and file contents sent to LLM providers
- Tool outputs included in context
- No automatic PII filtering

### Shell Execution

- `run_shell` requires `ask` policy by default
- Commands run with user's permissions
- No sandboxing beyond policy gates

### Web Fetch

- Hostname allowlist enforced
- Default hosts: github.com, raw.githubusercontent.com, docs.rs, developer.mozilla.org
- User can add/remove hosts in Settings
