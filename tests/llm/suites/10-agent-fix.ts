import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "10-agent-fix",
  title: "Agent: Fix Code",
  tests: [
    {
      id: "agent-fix-01",
      suite: "10-agent-fix",
      mode: "agent",
      description: "Fix all bugs in buggy.ts",
      messages: [
        {
          role: "user",
          content: "Read buggy.ts and fix any bugs you find. Write the fixed version back.",
        },
      ],
      expectedBehavior: "Identifies and fixes all 4 bugs",
      expectedTools: ["read_file", "write_file"],
      tags: ["agent"],
    },
    {
      id: "agent-fix-02",
      suite: "10-agent-fix",
      mode: "agent",
      description: "Identify bugs without fixing",
      messages: [
        { role: "user", content: "Read buggy.ts. What bugs do you see? Don't fix yet." },
      ],
      expectedBehavior: "Identifies bugs without writing",
      expectedTools: ["read_file"],
      tags: ["agent"],
    },
    {
      id: "agent-fix-03",
      suite: "10-agent-fix",
      mode: "agent",
      description: "Fix only type errors in buggy.ts",
      messages: [
        {
          role: "user",
          content: "Read buggy.ts and fix only the type errors. Leave other issues.",
        },
      ],
      expectedBehavior: "Fixes only type errors, doesn't change others",
      expectedTools: ["read_file", "write_file"],
      tags: ["agent"],
    },
    {
      id: "agent-fix-04",
      suite: "10-agent-fix",
      mode: "agent",
      description: "Add JSDoc to sample.ts exports",
      messages: [
        {
          role: "user",
          content: "Read sample.ts and add JSDoc comments to every exported function.",
        },
      ],
      expectedBehavior: "Adds valid JSDoc, doesn't change logic",
      expectedTools: ["read_file", "write_file"],
      tags: ["agent"],
    },
  ],
};
