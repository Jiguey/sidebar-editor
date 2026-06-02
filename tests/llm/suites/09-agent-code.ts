import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "09-agent-code",
  title: "Agent: Code Generation",
  tests: [
    {
      id: "agent-code-01",
      suite: "09-agent-code",
      mode: "agent",
      description: "Create utils/strings.ts",
      messages: [
        {
          role: "user",
          content:
            "Create a TypeScript utility file `utils/strings.ts` with functions: `capitalize`, `truncate`, `slugify`.",
        },
      ],
      expectedBehavior: "All three functions present, TypeScript correct",
      expectedTools: ["create_file"],
      tags: ["agent", "code"],
    },
    {
      id: "agent-code-02",
      suite: "09-agent-code",
      mode: "agent",
      description: "Create word_count.py script",
      messages: [
        {
          role: "user",
          content:
            "Create a Python script `scripts/word_count.py` that reads a file path from argv and prints word count.",
        },
      ],
      expectedBehavior: "Working Python script",
      expectedTools: ["create_file"],
      tags: ["agent", "code"],
    },
    {
      id: "agent-code-03",
      suite: "09-agent-code",
      mode: "agent",
      description: "Create Makefile",
      messages: [
        {
          role: "user",
          content: "Create a `Makefile` with targets: `build`, `test`, `clean`, `lint`.",
        },
      ],
      expectedBehavior: "Valid Makefile syntax",
      expectedTools: ["create_file"],
      tags: ["agent", "code"],
    },
    {
      id: "agent-code-04",
      suite: "09-agent-code",
      mode: "agent",
      description: "Create docker-compose.yml",
      messages: [
        {
          role: "user",
          content: "Create a `docker-compose.yml` for a Node app with a PostgreSQL database.",
        },
      ],
      expectedBehavior: "Valid YAML, correct service definitions",
      expectedTools: ["create_file"],
      tags: ["agent", "code"],
    },
    {
      id: "agent-code-05",
      suite: "09-agent-code",
      mode: "agent",
      description: "Create pagination type",
      messages: [
        {
          role: "user",
          content:
            "Write a TypeScript type for a paginated API response and save it to `types/pagination.ts`.",
        },
      ],
      expectedBehavior: "Correct generic TypeScript type",
      expectedTools: ["create_file"],
      tags: ["agent", "code"],
    },
    {
      id: "agent-code-06",
      suite: "09-agent-code",
      mode: "agent",
      description: "Create rename_files.sh",
      messages: [
        {
          role: "user",
          content:
            "Create `scripts/rename_files.sh` — a bash script that renames all `.txt` files in a directory to `.md`.",
        },
      ],
      expectedBehavior: "Working bash, handles edge cases",
      expectedTools: ["create_file"],
      tags: ["agent", "code"],
    },
  ],
};
