import fs from "node:fs/promises";
import path from "node:path";
import type { EvalRunContext } from "../types";

export async function writePlan(
  ctx: EvalRunContext,
  filename: string,
  body: string
): Promise<void> {
  const dir = path.join(ctx.workspacePath, "plans");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), body, "utf8");
}

export const SAMPLE_PLAN_4_TASKS = `---
id: refactor-auth
status: in_progress
created: 2026-05-29
updated: 2026-05-29T10:00:00Z
---

# Refactor Auth Module

## Tasks

- [x] Audit legacy auth imports
- [x] Implement JWT module
- [ ] Migrate user routes
- [ ] Remove legacy auth file
`;

export const SAMPLE_PLAN_DRAFT = `---
id: websocket-api
status: draft
created: 2026-05-29
updated: 2026-05-29T10:00:00Z
---

# Add WebSocket Support

## Tasks

- [ ] Design protocol
- [ ] Implement server handler
- [ ] Add client SDK
`;

export const SAMPLE_PLAN_ALL_DONE = `---
id: perf-audit
status: in_progress
created: 2026-05-29
updated: 2026-05-29T10:00:00Z
---

# Performance Audit

## Tasks

- [x] Profile bundle
- [x] Fix largest chunks
- [x] Verify metrics
`;
