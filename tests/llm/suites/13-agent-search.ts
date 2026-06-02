import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "13-agent-search",
  title: "Agent: Search",
  tests: [
    {
      id: "agent-search-01",
      suite: "13-agent-search",
      mode: "agent",
      description: "Find files importing from fs",
      messages: [{ role: "user", content: "Find all files that import from 'fs'." }],
      expectedBehavior: "Correct files returned",
      expectedTools: ["grep"],
      tags: ["agent"],
    },
    {
      id: "agent-search-02",
      suite: "13-agent-search",
      mode: "agent",
      description: "Find all .json files",
      messages: [{ role: "user", content: "Find all .json files in the workspace." }],
      expectedBehavior: "Correct list",
      expectedTools: ["find_file"],
      tags: ["agent"],
    },
    {
      id: "agent-search-03",
      suite: "13-agent-search",
      mode: "agent",
      description: "Count 'function' occurrences",
      messages: [
        {
          role: "user",
          content: "How many times does the word 'function' appear across all files?",
        },
      ],
      expectedBehavior: "Correct count or accurate per-file breakdown",
      expectedTools: ["grep"],
      tags: ["agent"],
    },
    {
      id: "agent-search-04",
      suite: "13-agent-search",
      mode: "agent",
      description: "Find TODO/FIXME comments",
      messages: [
        { role: "user", content: "Find all lines containing TODO or FIXME comments." },
      ],
      expectedBehavior: "Correct matches with line numbers",
      expectedTools: ["grep"],
      tags: ["agent"],
    },
  ],
};
