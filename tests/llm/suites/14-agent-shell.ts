import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "14-agent-shell",
  title: "Agent: Shell",
  tests: [
    {
      id: "agent-shell-01",
      suite: "14-agent-shell",
      mode: "agent",
      description: "Run echo hello world",
      messages: [{ role: "user", content: "Run `echo hello world` and tell me what you see." }],
      expectedBehavior: "Correct output",
      expectedTools: ["run_shell"],
      tags: ["agent"],
    },
    {
      id: "agent-shell-02",
      suite: "14-agent-shell",
      mode: "agent",
      description: "Check Node version",
      messages: [{ role: "user", content: "Check what version of Node is installed." }],
      expectedBehavior: "Correct version string",
      expectedTools: ["run_shell"],
      tags: ["agent"],
    },
    {
      id: "agent-shell-03",
      suite: "14-agent-shell",
      mode: "agent",
      description: "Run workspace tests",
      messages: [{ role: "user", content: "Run the tests in the workspace." }],
      expectedBehavior: "Executes test command, reports output",
      expectedTools: ["run_tests"],
      tags: ["agent"],
    },
    {
      id: "agent-shell-04",
      suite: "14-agent-shell",
      mode: "agent",
      description: "Count lines in .ts files",
      messages: [
        { role: "user", content: "Count the lines of code across all .ts files." },
      ],
      expectedBehavior: "Reasonable line count",
      expectedTools: ["run_shell"],
      tags: ["agent"],
    },
  ],
};
