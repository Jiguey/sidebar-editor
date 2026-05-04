# Tiny Llama tests

## Running

```bash
npm install
npm test
```

Watch mode: `npm run test:watch`

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
npm run test:ollama
```

Or all tests with Ollama enabled:

```bash
RUN_OLLAMA_TESTS=1 npm test
```

Optional host override:

```bash
RUN_OLLAMA_TESTS=1 OLLAMA_HOST=http://127.0.0.1:11434 npm test
```

Override the model used in the chat completion test:

```bash
RUN_OLLAMA_TESTS=1 OLLAMA_TEST_MODEL=qwen2.5:0.5b npm test
```

## Harness and tools (current behaviour)

1. **Process**: Tauri spawns the Node **sidecar** (`sidecar/dist/index.js`). The UI sends JSON lines: `start`, `chat`, `clear`, `approve_tool`, `stop`.

2. **Models / harness**: `start` carries `provider` (`anthropic` | `ollama` | `llamacpp`), `model`, keys, `workspacePath`, **`ollamaEndpoint`** / **`llamacppEndpoint`** + optional **`llamacppApiKey`**, **`harnessKind`** (`pi-latest` default, `pi-minimal` for read-only tools), and **`toolPolicy`**. The `started` event may include **`piPackageVersion`** from `@mariozechner/pi-coding-agent`.

3. **Anthropic**: The sidecar streams the Messages API with tool definitions. When the model emits a **tool_use** block:
   - If policy says a prompt is needed, the sidecar yields **`tool_approval_needed`** and **waits** for an `approve_tool` line with the same `callId` as the tool-use id (or times out as deny).
   - After approval it emits **`tool_start`** then **`tool_end`**. Execution against the workspace is still a **stub** (no Tauri `read_file` bridge yet).
   - If denied, it emits **`tool_end`** with `denied: true` and a short assistant message.

4. **Ollama**: Chat is plain text streaming; **tools are not passed** to Ollama yet, so you will not see tool cards from local models until that is implemented.

5. **Chat UI**: `tool_start` / streaming assistant text appear in the thread; **`tool_approval_needed`** opens the yellow **Allow / Deny** strip at the top of the chat pane.

## What to add next

- Wire **tool execution** to Tauri commands and stream real results into `tool_end`.
- Pass **tools + structured output** to Ollama where the server supports it.
- E2E tests under Tauri (heavy); keep unit/integration tests here first.
