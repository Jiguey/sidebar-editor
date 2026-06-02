# LLM Eval Harness

Long-running eval suite that exercises **Chat**, **Plan**, and **Agent** modes against a real Ollama model. Runs outside the Tauri desktop shell via `tsx`.

**Spec:** [docs/specs/31-llm-eval-harness.md](../../docs/specs/31-llm-eval-harness.md)

## Prerequisites

- Ollama running locally (`http://localhost:11434`)
- Target model pulled (default: `qwen3.6-27B-GGUF:UD-Q2_K_XL`)
- `rg` (ripgrep) on PATH for grep tests (falls back to Node scan if missing)

## Commands

```bash
# Full run (45–90 min on large models)
pnpm eval

# Single suite
pnpm eval -- --suite 08-agent-files

# Single test
pnpm eval -- --test agent-files-01

# Filter by mode
pnpm eval -- --mode agent

# View latest markdown report
pnpm eval:report
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `EVAL_MODEL` | `qwen3.6-27B-GGUF:UD-Q2_K_XL` | Ollama model name |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama base URL |
| `EVAL_FORCE_RESET` | — | Set to `1` to reset dirty fixtures |

## Architecture

| Layer | Implementation |
|-------|----------------|
| Provider | `streamOneTurn` → Ollama via `openaiCompat` (same path as the app) |
| Agent loop | Simplified harness loop in `run-test.ts` (text tool fallback for Ollama) |
| File tools | **Node** `eval-tool-runner.ts` — not Tauri/Rust (harness runs headless) |
| Results | Streamed to `tests/llm/results/<run-id>/` as each test completes |

## Results

Each run writes:

```
tests/llm/results/<run-id>/
  summary.json
  report.md
  suites/
    01-chat-basic.json
    ...
```

`results/` is gitignored. Review `report.md` for human-readable output; edit suite JSON to add `humanScore` / `humanNotes`.

## Fixtures

Committed baseline in `fixtures/workspace/`. Reset before each run via git checkout + clean. Initialized as a git repo for agent git tests.
