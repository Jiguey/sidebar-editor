import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "04-chat-code",
  title: "Chat: Code",
  tests: [
    {
      id: "chat-code-01",
      suite: "04-chat-code",
      mode: "chat",
      description: "TypeScript deep clone",
      messages: [
        {
          role: "user",
          content:
            "Write a TypeScript function that deep-clones an object without using JSON.parse/stringify.",
        },
      ],
      expectedBehavior: "Working recursive clone, handles edge cases",
      tags: ["code"],
    },
    {
      id: "chat-code-02",
      suite: "04-chat-code",
      mode: "chat",
      description: "Python retry decorator",
      messages: [
        {
          role: "user",
          content:
            "Write a Python decorator that retries a function up to 3 times with exponential backoff.",
        },
      ],
      expectedBehavior: "Correct decorator syntax, working backoff logic",
      tags: ["code"],
    },
    {
      id: "chat-code-03",
      suite: "04-chat-code",
      mode: "chat",
      description: "SQL second-highest salary",
      messages: [
        {
          role: "user",
          content:
            "Write a SQL query that finds the second-highest salary in an employees table.",
        },
      ],
      expectedBehavior: "Correct query (subquery or LIMIT/OFFSET)",
      tags: ["code"],
    },
    {
      id: "chat-code-04",
      suite: "04-chat-code",
      mode: "chat",
      description: "Explain reduce to object",
      messages: [
        {
          role: "user",
          content:
            "Explain this code line by line: `arr.reduce((acc, x) => ({...acc, [x.id]: x}), {})`",
        },
      ],
      expectedBehavior: "Accurate explanation of reduce + computed property",
      tags: ["code"],
    },
    {
      id: "chat-code-05",
      suite: "04-chat-code",
      mode: "chat",
      description: "Rust word count",
      messages: [
        {
          role: "user",
          content: "Write a Rust function that reads a file and returns its word count.",
        },
      ],
      expectedBehavior: "Compiles, handles errors with Result",
      tags: ["code"],
    },
    {
      id: "chat-code-06",
      suite: "04-chat-code",
      mode: "chat",
      description: "Email regex with explanation",
      messages: [
        {
          role: "user",
          content: "Write a regex that validates an email address. Explain each part.",
        },
      ],
      expectedBehavior: "Reasonable regex, accurate explanation",
      tags: ["code"],
    },
    {
      id: "chat-code-07",
      suite: "04-chat-code",
      mode: "chat",
      description: "var closure in setTimeout loop",
      messages: [
        {
          role: "user",
          content:
            "What's wrong with this code? `for (var i = 0; i < 5; i++) { setTimeout(() => console.log(i), 100); }`",
        },
      ],
      expectedBehavior: "Identifies closure/var issue, suggests fix",
      tags: ["code"],
    },
    {
      id: "chat-code-08",
      suite: "04-chat-code",
      mode: "chat",
      description: "Binary search in TypeScript",
      messages: [
        {
          role: "user",
          content:
            "Write a binary search implementation in TypeScript with full type annotations.",
        },
      ],
      expectedBehavior: "Correct, typed, handles empty array",
      tags: ["code"],
    },
    {
      id: "chat-code-09",
      suite: "04-chat-code",
      mode: "chat",
      description: "Callback to async/await",
      messages: [
        {
          role: "user",
          content:
            "Convert this callback-based function to use async/await: `fs.readFile(path, 'utf8', (err, data) => {...})`",
        },
      ],
      expectedBehavior: "Correct promisify pattern",
      tags: ["code"],
    },
    {
      id: "chat-code-10",
      suite: "04-chat-code",
      mode: "chat",
      description: "Debounce function",
      messages: [{ role: "user", content: "Write a debounce function in JavaScript." }],
      expectedBehavior: "Correct implementation with delay parameter",
      tags: ["code"],
    },
  ],
};
