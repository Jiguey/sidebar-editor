import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "02-chat-reasoning",
  title: "Chat: Reasoning",
  tests: [
    {
      id: "chat-reason-01",
      suite: "02-chat-reasoning",
      mode: "chat",
      description: "3-gallon and 5-gallon jug puzzle",
      messages: [
        {
          role: "user",
          content:
            "I have a 3-gallon jug and a 5-gallon jug. How do I measure exactly 4 gallons?",
        },
      ],
      expectedBehavior: "Correct step-by-step solution",
      tags: ["basic"],
    },
    {
      id: "chat-reason-02",
      suite: "02-chat-reasoning",
      mode: "chat",
      description: "Bat and ball cost puzzle",
      messages: [
        {
          role: "user",
          content:
            "A bat and ball cost $1.10. The bat costs $1 more than the ball. How much does the ball cost?",
        },
      ],
      expectedBehavior: "$0.05, not $0.10 — tests for common error",
      tags: ["basic"],
    },
    {
      id: "chat-reason-03",
      suite: "02-chat-reasoning",
      mode: "chat",
      description: "Induction proof for sum of naturals",
      messages: [
        {
          role: "user",
          content:
            "Write a proof by induction that the sum of first n natural numbers is n(n+1)/2.",
        },
      ],
      expectedBehavior: "Valid formal proof",
      tags: ["basic"],
    },
    {
      id: "chat-reason-04",
      suite: "02-chat-reasoning",
      mode: "chat",
      description: "URL parsing edge cases",
      messages: [
        {
          role: "user",
          content: "What are all the edge cases I should handle when parsing a URL?",
        },
      ],
      expectedBehavior: "Comprehensive edge cases including encoding, auth, fragments",
      tags: ["basic"],
    },
    {
      id: "chat-reason-05",
      suite: "02-chat-reasoning",
      mode: "chat",
      description: "Rate limiter design tradeoffs",
      messages: [
        {
          role: "user",
          content:
            "I need to design a rate limiter. Walk me through the tradeoffs between token bucket, sliding window, and fixed window approaches.",
        },
      ],
      expectedBehavior: "Accurate tradeoffs, practical recommendation",
      tags: ["basic"],
    },
    {
      id: "chat-reason-06",
      suite: "02-chat-reasoning",
      mode: "chat",
      description: "Why indexes slow writes",
      messages: [
        {
          role: "user",
          content: "Why might a database index slow down writes but speed up reads?",
        },
      ],
      expectedBehavior: "Correct explanation of index maintenance overhead",
      tags: ["basic"],
    },
  ],
};
