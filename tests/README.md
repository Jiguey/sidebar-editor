# Tiny Llama tests

## Running

```bash
pnpm install
pnpm test
```

Watch mode: `pnpm test:watch`

## Architecture under test

Tiny Llama uses a **two-tier** runtime—**no Node sidecar**:

| Layer | What tests cover |
|-------|------------------|
| **Svelte / TS** | `tests/unit/` — providers (mocked `fetch`), `toolRunner`, policy, agent limits, plans parse (when added), etc. |
| **Rust** | Exercised at runtime via Tauri in the app; not a separate Rust test crate in this repo yet |
| **Live Ollama** | `tests/integration/ollama.test.ts` — HTTP to local Ollama, same protocol as `openaiCompat.ts` |

The agent loop (`ChatPane` → `streamOneTurn` → `executeTool` → IPC) is validated with **unit tests** and manual `pnpm tauri dev`. There is no harness process to integration-test.

## Ollama integration

`tests/integration/ollama.test.ts` talks to a local Ollama server. It is **skipped by default** so CI and laptops without Ollama stay green.

1. Install [Ollama](https://ollama.com) and ensure it is listening (default `http://127.0.0.1:11434`).
2. Pull a small test model (default in tests is **`llama3.2:1b`**):

```bash
ollama pull llama3.2:1b
```

Optional: pull the set this repo suggests for the UI / local dev:

```bash
./scripts/pull-recommended-ollama.sh
```

Run only the Ollama integration file:

```bash
pnpm test:ollama
```

Or all tests with Ollama enabled:

```bash
RUN_OLLAMA_TESTS=1 pnpm test
```

Optional host override:

```bash
RUN_OLLAMA_TESTS=1 OLLAMA_HOST=http://127.0.0.1:11434 pnpm test
```

Override the model used in the chat completion test:

```bash
RUN_OLLAMA_TESTS=1 OLLAMA_TEST_MODEL=qwen2.5:0.5b pnpm test
```

## Agent and tools (current behaviour)

1. **Agent loop** — `ChatPane.svelte` `runAgentLoop()`: `streamOneTurn()` → optional tools → append results → repeat until stop or limits.

2. **Providers** — `src/lib/providers/anthropic.ts` and `openaiCompat.ts` stream via **`fetch`** in the webview (not a sidecar). Settings supply API keys, endpoints, and model id.

3. **Tools** — When the model returns tool calls, `executeToolCallsWithApproval()` runs `executeTool()` in `toolRunner.ts`, which calls Tauri commands (`read_file`, `grep_workspace`, `run_shell`, etc.). Policy `allow` / `ask` / `deny` is enforced in the UI.

4. **Ollama / llama.cpp** — OpenAI-compatible chat completions with tools when the server supports them (see `openaiCompat.test.ts` and optional live Ollama test).

5. **Anthropic** — Messages API SSE with tool streaming and optional extended thinking (`anthropic.test.ts`).

6. **Chat UI** — Tool cards, activity feed (`activity.ts`), and the approval strip for `ask` tools.

## What to add next

- More unit coverage for `streamTurn` edge cases and provider error paths.
- Tauri command tests (Rust `#[cfg(test)]` or dedicated crate) if filesystem/git regressions become painful.
- E2E under Tauri (heavy); keep unit/integration tests here first.
