import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "07-plan-multiturn",
  title: "Plan: Multi-turn",
  tests: [
    {
      id: "plan-multi-01",
      suite: "07-plan-multiturn",
      mode: "plan",
      description: "Create plan, expand testing, mark tasks done",
      messages: [
        {
          role: "user",
          content: "Create a plan for adding user profile avatars to the app.",
        },
        { role: "user", content: "Add more detail to the testing tasks." },
        { role: "user", content: "Mark the first two tasks as done." },
      ],
      expectedBehavior: "Maintains plan state across turns, correct file updates",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
    {
      id: "plan-multi-02",
      suite: "07-plan-multiturn",
      mode: "plan",
      description: "Blocked migration with status update",
      messages: [
        {
          role: "user",
          content: "Create a plan for migrating our API from REST to GraphQL.",
        },
        {
          role: "user",
          content:
            "I'm blocked on the database migration step — add a note about needing DBA review.",
        },
        { role: "user", content: "Update status to blocked." },
      ],
      expectedBehavior: "Correct section addition and status update",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
  ],
};
