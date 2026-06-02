import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "05-plan-create",
  title: "Plan: Create",
  tests: [
    {
      id: "plan-create-01",
      suite: "05-plan-create",
      mode: "plan",
      description: "Plan JWT auth refactor",
      messages: [
        {
          role: "user",
          content:
            "I need to refactor the authentication module to use JWT instead of sessions.",
        },
      ],
      expectedBehavior: "Creates plans/*.md with frontmatter + task breakdown",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
    {
      id: "plan-create-02",
      suite: "05-plan-create",
      mode: "plan",
      description: "Plan WebSocket support",
      messages: [
        { role: "user", content: "Plan out adding WebSocket support to the backend API." },
      ],
      expectedBehavior: "Creates plan with realistic phases and tasks",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
    {
      id: "plan-create-03",
      suite: "05-plan-create",
      mode: "plan",
      description: "Plan SQLite to PostgreSQL migration",
      messages: [
        {
          role: "user",
          content: "I want to migrate the database from SQLite to PostgreSQL.",
        },
      ],
      expectedBehavior: "Creates plan covering schema migration, connection layer, testing",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
    {
      id: "plan-create-04",
      suite: "05-plan-create",
      mode: "plan",
      description: "Plan frontend bundle performance audit",
      messages: [
        { role: "user", content: "Plan a performance audit of the frontend bundle." },
      ],
      expectedBehavior: "Creates plan with measurable steps",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
    {
      id: "plan-create-05",
      suite: "05-plan-create",
      mode: "plan",
      description: "Plan E2E encryption for messaging",
      messages: [
        {
          role: "user",
          content: "We need to add end-to-end encryption to the messaging feature.",
        },
      ],
      expectedBehavior: "Creates plan covering key exchange, encryption layer, storage",
      expectedTools: ["create_file"],
      tags: ["plan"],
    },
  ],
};
