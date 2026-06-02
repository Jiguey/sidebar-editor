import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "15-stress-repetition",
  title: "Stress: Repetition",
  tests: [
    {
      id: "stress-01",
      suite: "15-stress-repetition",
      mode: "chat",
      description: "TypeScript reverse linked list",
      messages: [
        {
          role: "user",
          content: "Write a TypeScript function that reverses a linked list.",
        },
      ],
      expectedBehavior: "Working implementation, may vary between runs",
      tags: ["stress", "code"],
      repeat: 5,
    },
    {
      id: "stress-02",
      suite: "15-stress-repetition",
      mode: "chat",
      description: "Explain JavaScript closures",
      messages: [{ role: "user", content: "Explain what a closure is in JavaScript." }],
      expectedBehavior: "Consistent quality explanation",
      tags: ["stress"],
      repeat: 5,
    },
    {
      id: "stress-03",
      suite: "15-stress-repetition",
      mode: "plan",
      description: "Plan REST to GraphQL migration",
      messages: [
        {
          role: "user",
          content: "Create a plan for migrating a REST API to GraphQL.",
        },
      ],
      expectedBehavior: "Plan file created with tasks",
      expectedTools: ["create_file"],
      tags: ["stress"],
      repeat: 5,
    },
    {
      id: "stress-04",
      suite: "15-stress-repetition",
      mode: "agent",
      description: "Summarize sample.ts",
      messages: [{ role: "user", content: "Read sample.ts and summarize it." }],
      expectedBehavior: "Accurate summary via read_file",
      expectedTools: ["read_file"],
      tags: ["stress"],
      repeat: 5,
    },
    {
      id: "stress-05",
      suite: "15-stress-repetition",
      mode: "chat",
      description: "SOLID principles",
      messages: [{ role: "user", content: "What are the SOLID principles?" }],
      expectedBehavior: "Lists all five principles accurately",
      tags: ["stress"],
      repeat: 5,
    },
  ],
};
