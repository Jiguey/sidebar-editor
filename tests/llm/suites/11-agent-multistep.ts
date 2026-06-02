import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "11-agent-multistep",
  title: "Agent: Multi-step",
  tests: [
    {
      id: "agent-multi-01",
      suite: "11-agent-multistep",
      mode: "agent",
      description: "Report functions with >3 parameters",
      messages: [
        {
          role: "user",
          content:
            "Read all .ts files, find any function that takes more than 3 parameters, and create a report.md listing them.",
        },
      ],
      expectedBehavior: "Correct multi-file analysis, accurate report",
      expectedTools: ["read_file", "create_file"],
      tags: ["agent"],
    },
    {
      id: "agent-multi-02",
      suite: "11-agent-multistep",
      mode: "agent",
      description: "Create src/ directory structure",
      messages: [
        {
          role: "user",
          content:
            "Create a `src/` directory structure: `src/utils/`, `src/types/`, `src/api/`. Add an `index.ts` to each.",
        },
      ],
      expectedBehavior: "All directories and files created",
      expectedTools: ["create_file"],
      tags: ["agent"],
    },
    {
      id: "agent-multi-03",
      suite: "11-agent-multistep",
      mode: "agent",
      description: "Write and run unit tests for sample.ts",
      messages: [
        {
          role: "user",
          content: "Read sample.ts, write unit tests for it in `sample.test.ts`, then run the tests.",
        },
      ],
      expectedBehavior: "Tests written and executed",
      expectedTools: ["read_file", "create_file"],
      tags: ["agent"],
    },
    {
      id: "agent-multi-04",
      suite: "11-agent-multistep",
      mode: "agent",
      description: "Collect TODO comments into TODO.md",
      messages: [
        {
          role: "user",
          content:
            "Find all TODO comments across all files in the workspace and create a `TODO.md` listing them with file and line number.",
        },
      ],
      expectedBehavior: "Accurate grep results, correct report",
      expectedTools: ["grep", "create_file"],
      tags: ["agent"],
    },
    {
      id: "agent-multi-05",
      suite: "11-agent-multistep",
      mode: "agent",
      description: "Create CHANGELOG and link from README",
      messages: [
        {
          role: "user",
          content:
            "Read the README, create a `CHANGELOG.md` with an initial entry, then update the README to link to it.",
        },
      ],
      expectedBehavior: "Both files created/updated correctly",
      expectedTools: ["read_file", "create_file", "write_file"],
      tags: ["agent"],
    },
  ],
};
