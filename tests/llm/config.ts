import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const EVAL_CONFIG = {
  model: process.env.EVAL_MODEL ?? "qwen3.6-27B-GGUF:UD-Q2_K_XL",
  ollamaBaseUrl: process.env.OLLAMA_HOST ?? "http://localhost:11434",
  timeouts: {
    firstToken: 120_000,
    fullResponse: 600_000,
    toolCall: 120_000,
    agentRun: 900_000,
  },
  repetitions: {
    basic: 3,
    code: 2,
    agent: 2,
    stress: 5,
  },
  maxAgentSteps: 10,
  resultsDir: path.join(ROOT, "tests/llm/results"),
  fixturesDir: path.join(ROOT, "tests/llm/fixtures/workspace"),
  repoRoot: ROOT,
} as const;

export type EvalConfig = typeof EVAL_CONFIG;
