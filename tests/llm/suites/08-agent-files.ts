import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "08-agent-files",
  title: "Agent: File Operations",
  tests: [
    {
      id: "agent-files-01",
      suite: "08-agent-files",
      mode: "agent",
      description: "Read sample.ts and summarize",
      messages: [{ role: "user", content: "Read sample.ts and summarize what it does." }],
      expectedBehavior: "Reads file, produces accurate summary",
      expectedTools: ["read_file"],
      tags: ["agent"],
    },
    {
      id: "agent-files-02",
      suite: "08-agent-files",
      mode: "agent",
      description: "List all files in workspace",
      messages: [{ role: "user", content: "List all files in the fixtures workspace." }],
      expectedBehavior: "Returns correct file listing",
      expectedTools: ["list_dir"],
      tags: ["agent"],
    },
    {
      id: "agent-files-03",
      suite: "08-agent-files",
      mode: "agent",
      description: "Create output.md workspace description",
      messages: [
        {
          role: "user",
          content: "Create a new file called `output.md` with a short description of the workspace.",
        },
      ],
      expectedBehavior: "File created with sensible content",
      expectedTools: ["create_file"],
      tags: ["agent"],
    },
    {
      id: "agent-files-04",
      suite: "08-agent-files",
      mode: "agent",
      description: "Count top-level keys in sample.json",
      messages: [
        {
          role: "user",
          content: "Read sample.json and tell me how many top-level keys it has.",
        },
      ],
      expectedBehavior: "Correct count from actual file",
      expectedTools: ["read_file"],
      tags: ["agent"],
    },
    {
      id: "agent-files-05",
      suite: "08-agent-files",
      mode: "agent",
      description: "Get full file tree",
      messages: [{ role: "user", content: "Get the full file tree of the workspace." }],
      expectedBehavior: "Returns tree, model describes it accurately",
      expectedTools: ["get_file_tree"],
      tags: ["agent"],
    },
    {
      id: "agent-files-06",
      suite: "08-agent-files",
      mode: "agent",
      description: "Read README and create SUMMARY.md",
      messages: [
        {
          role: "user",
          content: "Read the README and then create a SUMMARY.md with the key points.",
        },
      ],
      expectedBehavior: "Both tool calls succeed, summary is accurate",
      expectedTools: ["read_file", "create_file"],
      tags: ["agent"],
    },
    {
      id: "agent-files-07",
      suite: "08-agent-files",
      mode: "agent",
      description: "Find TypeScript files",
      messages: [{ role: "user", content: "Find all TypeScript files in the workspace." }],
      expectedBehavior: "Returns correct .ts files",
      expectedTools: ["find_file"],
      tags: ["agent"],
    },
    {
      id: "agent-files-08",
      suite: "08-agent-files",
      mode: "agent",
      description: "Add Python type annotations",
      messages: [
        {
          role: "user",
          content:
            "Read sample.py and rewrite it with type annotations, saving to `sample_typed.py`.",
        },
      ],
      expectedBehavior: "Correct Python type annotations, file written",
      expectedTools: ["read_file", "create_file"],
      tags: ["agent"],
    },
  ],
};
