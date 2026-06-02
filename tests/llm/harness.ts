#!/usr/bin/env tsx
import fs from "node:fs/promises";
import { EVAL_CONFIG } from "./config";
import { setupFixtures } from "./fixtures";
import { ResultsWriter, type RunSummaryStats } from "./results-writer";
import { preflightCheck, runSuite } from "./suite-runner";
import { allSuites, findSuite, findTest } from "./suites";
import type { LLMTestResult } from "./types";

function parseArgs(argv: string[]) {
  let suiteId: string | undefined;
  let testId: string | undefined;
  let mode: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--suite" && argv[i + 1]) suiteId = argv[++i];
    else if (arg === "--test" && argv[i + 1]) testId = argv[++i];
    else if (arg === "--mode" && argv[i + 1]) mode = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: pnpm eval [--suite ID] [--test ID] [--mode chat|plan|agent]

Environment:
  EVAL_MODEL          Ollama model (default: ${EVAL_CONFIG.model})
  OLLAMA_HOST         Ollama base URL (default: ${EVAL_CONFIG.ollamaBaseUrl})
  EVAL_FORCE_RESET=1  Reset fixtures even if dirty
`);
      process.exit(0);
    }
  }

  return { suiteId, testId, mode };
}

function tallyResult(stats: RunSummaryStats, suiteId: string, result: LLMTestResult) {
  stats.totalTests++;
  if (!stats.suites[suiteId]) {
    stats.suites[suiteId] = { total: 0, passed: 0, failed: 0, errors: 0 };
  }
  stats.suites[suiteId].total++;
  if (result.status === "pass") {
    stats.passed++;
    stats.suites[suiteId].passed++;
  } else if (result.status === "fail") {
    stats.failed++;
    stats.suites[suiteId].failed++;
  } else {
    stats.errors++;
    stats.suites[suiteId].errors++;
    if (result.status === "timeout") stats.timeouts++;
  }
}

async function main() {
  const { suiteId, testId, mode } = parseArgs(process.argv.slice(2));
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const writer = new ResultsWriter(EVAL_CONFIG.resultsDir);
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  await fs.mkdir(EVAL_CONFIG.resultsDir, { recursive: true });

  console.log("\n🦙 Tiny Llama LLM Eval Harness");
  console.log(`Run ID: ${runId}`);
  console.log(`Model: ${EVAL_CONFIG.model}`);
  console.log(`Results: ${EVAL_CONFIG.resultsDir}/${runId}/\n`);

  await preflightCheck();
  await setupFixtures();

  const ctx = {
    workspacePath: EVAL_CONFIG.fixturesDir,
    fixturesDir: EVAL_CONFIG.fixturesDir,
    resultsDir: EVAL_CONFIG.resultsDir,
  };

  let suites = allSuites;
  if (suiteId) {
    const match = findSuite(suiteId);
    if (!match) {
      console.error(`Unknown suite: ${suiteId}`);
      process.exit(1);
    }
    suites = [match];
  } else if (testId) {
    const found = findTest(testId);
    if (!found) {
      console.error(`Unknown test: ${testId}`);
      process.exit(1);
    }
    suites = [{ ...found.suite, tests: [found.test] }];
  }

  const stats: RunSummaryStats = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: 0,
    timeouts: 0,
    suites: {},
  };

  for (const suite of suites) {
    console.log(`\n📦 Suite ${suite.id} — ${suite.title}`);
    const results = await runSuite(suite, {
      writer,
      runId,
      ctx,
      filterTestId: testId,
      filterMode: mode,
    });
    for (const r of results) tallyResult(stats, suite.id, r);
  }

  const completedAt = new Date().toISOString();
  await writer.writeRunSummary(runId, {
    model: EVAL_CONFIG.model,
    startedAt,
    completedAt,
    durationMs: Date.now() - t0,
    stats,
  });
  await writer.writeMarkdownReport(runId, EVAL_CONFIG.model, stats);

  console.log(
    `\n✅ Run complete: ${stats.passed} pass / ${stats.failed} fail / ${stats.errors} error`
  );
  console.log(`📄 Report: ${EVAL_CONFIG.resultsDir}/${runId}/report.md`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
