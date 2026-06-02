import type { LLMSuite } from "../types";

export const suite: LLMSuite = {
  id: "12-agent-git",
  title: "Agent: Git",
  tests: [
    {
      id: "agent-git-01",
      suite: "12-agent-git",
      mode: "agent",
      description: "Current git status",
      messages: [{ role: "user", content: "What's the current git status of the workspace?" }],
      expectedBehavior: "Accurate status listing",
      expectedTools: ["get_git_status"],
      tags: ["agent"],
    },
    {
      id: "agent-git-02",
      suite: "12-agent-git",
      mode: "agent",
      description: "Last 5 commits",
      messages: [{ role: "user", content: "Show me the last 5 commits." }],
      expectedBehavior: "Correct log output, model summarizes it",
      expectedTools: ["get_git_log"],
      tags: ["agent"],
    },
    {
      id: "agent-git-03",
      suite: "12-agent-git",
      mode: "agent",
      description: "Unstaged diff",
      messages: [{ role: "user", content: "Show me the diff of any unstaged changes." }],
      expectedBehavior: "Correct diff, model explains changes",
      expectedTools: ["get_git_diff"],
      tags: ["agent"],
    },
    {
      id: "agent-git-04",
      suite: "12-agent-git",
      mode: "agent",
      description: "Create file and check git status",
      messages: [
        {
          role: "user",
          content: "Create a new file called `git-test.txt`, then tell me what the git status looks like.",
        },
      ],
      expectedBehavior: "New untracked file appears in status",
      expectedTools: ["create_file", "get_git_status"],
      tags: ["agent"],
    },
  ],
};
