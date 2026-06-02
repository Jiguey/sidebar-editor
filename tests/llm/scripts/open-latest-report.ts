#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EVAL_CONFIG } from "../config";
import { findLatestRunId } from "../results-writer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

async function main() {
  const runId = await findLatestRunId(EVAL_CONFIG.resultsDir);
  if (!runId) {
    console.error("No eval results found. Run `pnpm eval` first.");
    process.exit(1);
  }

  const reportPath = path.join(EVAL_CONFIG.resultsDir, runId, "report.md");
  try {
    await fs.access(reportPath);
  } catch {
    console.error(`Report not found: ${reportPath}`);
    process.exit(1);
  }

  const pager = process.env.PAGER ?? "less";
  const result = spawnSync(pager, [reportPath], { stdio: "inherit", cwd: ROOT });
  if (result.error || (result.status != null && result.status > 1)) {
    const text = await fs.readFile(reportPath, "utf8");
    console.log(text);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
