import type { LLMSuite } from "../types";
import {
  SAMPLE_PLAN_4_TASKS,
  SAMPLE_PLAN_ALL_DONE,
  SAMPLE_PLAN_DRAFT,
  writePlan,
} from "./plan-fixtures";

export const suite: LLMSuite = {
  id: "06-plan-update",
  title: "Plan: Update",
  tests: [
    {
      id: "plan-update-01",
      suite: "06-plan-update",
      mode: "plan",
      description: "Check off JWT task after completion",
      messages: [{ role: "user", content: "I finished the JWT implementation. Update the plan." }],
      setup: (ctx) => writePlan(ctx, "2026-05-29-refactor-auth.md", SAMPLE_PLAN_4_TASKS),
      expectedBehavior: "Checks off the correct task, updates updated timestamp",
      expectedTools: ["read_file", "write_file"],
      tags: ["plan"],
    },
    {
      id: "plan-update-02",
      suite: "06-plan-update",
      mode: "plan",
      description: "Start working on draft plan",
      messages: [{ role: "user", content: "Start working on this plan." }],
      setup: (ctx) => writePlan(ctx, "2026-05-29-websocket-api.md", SAMPLE_PLAN_DRAFT),
      expectedBehavior: "Updates status to in_progress",
      expectedTools: ["read_file", "write_file"],
      tags: ["plan"],
    },
    {
      id: "plan-update-03",
      suite: "06-plan-update",
      mode: "plan",
      description: "Append migration test task",
      messages: [{ role: "user", content: "Add a task for writing migration tests." }],
      setup: (ctx) => writePlan(ctx, "2026-05-29-refactor-auth.md", SAMPLE_PLAN_4_TASKS),
      expectedBehavior: "Appends new - [ ] item to Tasks section",
      expectedTools: ["read_file", "write_file"],
      tags: ["plan"],
    },
    {
      id: "plan-update-04",
      suite: "06-plan-update",
      mode: "plan",
      description: "Mark plan done when all tasks complete",
      messages: [{ role: "user", content: "All tasks are done." }],
      setup: (ctx) => writePlan(ctx, "2026-05-29-perf-audit.md", SAMPLE_PLAN_ALL_DONE),
      expectedBehavior: "Updates status to done",
      expectedTools: ["read_file", "write_file"],
      tags: ["plan"],
    },
  ],
};
