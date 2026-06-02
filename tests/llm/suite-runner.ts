import { listOllamaModels, ollamaReachable } from "../integration/helpers/ollama";
import { EVAL_CONFIG } from "./config";
import { runAgentTest, runChatTest, resolveRepetitions } from "./run-test";
import { ResultsWriter } from "./results-writer";
import type { EvalRunContext, LLMSuite, LLMTestResult } from "./types";

export async function preflightCheck(): Promise<void> {
  const host = EVAL_CONFIG.ollamaBaseUrl.replace(/\/$/, "");
  if (!(await ollamaReachable(host))) {
    throw new Error(`Ollama not reachable at ${host} — is it running?`);
  }
  const models = await listOllamaModels(host);
  const model = EVAL_CONFIG.model;
  const found = models.some((m) => m === model || m.startsWith(`${model}:`));
  if (!found && !models.some((m) => m.includes(model.split(":")[0] ?? model))) {
    throw new Error(`Model ${model} not found. Run: ollama pull ${model.split(":")[0]}`);
  }
}

export async function runSuite(
  suite: LLMSuite,
  options: {
    writer: ResultsWriter;
    runId: string;
    ctx: EvalRunContext;
    filterTestId?: string;
    filterMode?: string;
  }
): Promise<LLMTestResult[]> {
  const results: LLMTestResult[] = [];

  for (const test of suite.tests) {
    if (options.filterTestId && test.id !== options.filterTestId) continue;
    if (options.filterMode && test.mode !== options.filterMode) continue;

    const reps = resolveRepetitions(test, EVAL_CONFIG.repetitions);
    for (let i = 1; i <= reps; i++) {
      console.log(`  ▶ ${test.id} (run ${i}/${reps})`);
      const result =
        test.mode === "chat"
          ? await runChatTest({
              test,
              runIndex: i,
              model: EVAL_CONFIG.model,
              ollamaBaseUrl: EVAL_CONFIG.ollamaBaseUrl,
              workspacePath: options.ctx.workspacePath,
              timeouts: EVAL_CONFIG.timeouts,
            })
          : await runAgentTest({
              test,
              runIndex: i,
              model: EVAL_CONFIG.model,
              ollamaBaseUrl: EVAL_CONFIG.ollamaBaseUrl,
              workspacePath: options.ctx.workspacePath,
              timeouts: EVAL_CONFIG.timeouts,
              maxAgentSteps: EVAL_CONFIG.maxAgentSteps,
              ctx: options.ctx,
            });

      results.push(result);
      await options.writer.appendSuiteResult(options.runId, suite.id, result);
      console.log(`    ${result.status} (${(result.durationMs / 1000).toFixed(1)}s)`);
    }
  }

  return results;
}
