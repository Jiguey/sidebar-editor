import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "03-chat-multiturn",
  title: "Chat: Multi-turn",
  tests: [
    {
      id: "chat-multi-01",
      suite: "03-chat-multiturn",
      mode: "chat",
      description: "REST API auth with Express",
      messages: [
        { role: "user", content: "I'm building a REST API in Node." },
        { role: "user", content: "What auth method should I use?" },
        { role: "user", content: "How would I implement that with Express?" },
      ],
      expectedBehavior: "Maintains Node/Express context throughout",
      tags: ["code"],
    },
    {
      id: "chat-multi-02",
      suite: "03-chat-multiturn",
      mode: "chat",
      description: "Variable rename in payment context",
      messages: [
        { role: "user", content: "Let's say my variable is called `foo`." },
        { role: "user", content: "What's a better name for it in a payment context?" },
        { role: "user", content: "Now use that name in an example function." },
      ],
      expectedBehavior: "Carries foo context, payment-appropriate rename, uses it",
      tags: ["code"],
    },
    {
      id: "chat-multi-03",
      suite: "03-chat-multiturn",
      mode: "chat",
      description: "Recursion to iteration",
      messages: [
        { role: "user", content: "Explain recursion." },
        { role: "user", content: "Now explain it with a tree traversal example." },
        { role: "user", content: "What's the iterative equivalent?" },
      ],
      expectedBehavior: "Builds on each turn coherently",
      tags: ["code"],
    },
    {
      id: "chat-multi-04",
      suite: "03-chat-multiturn",
      mode: "chat",
      description: "5-turn debugging conversation",
      messages: [
        {
          role: "user",
          content:
            "I have a function that returns undefined when it should return a number. Here's the code: `function getTotal(items) { let sum; for (const i of items) sum += i.price; return sum; }`",
        },
        { role: "user", content: "What's wrong with it?" },
        {
          role: "user",
          content: "Can you show me the fix?",
        },
        {
          role: "user",
          content:
            "Now I have another bug: `async function load() { const data = fetch('/api'); return data.json(); }` — it fails.",
        },
        { role: "user", content: "What's wrong this time?" },
      ],
      expectedBehavior: "Tracks state across turns, addresses each bug",
      tags: ["code"],
    },
  ],
};
