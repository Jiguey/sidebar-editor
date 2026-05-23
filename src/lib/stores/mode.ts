import { writable } from "svelte/store";
import { READ_ONLY_TOOLS, ALL_TOOL_NAMES } from "../tools/toolDefinitions";

export type ChatMode = "chat" | "plan" | "agent";

export interface ModeConfig {
  label: string;
  description: string;
  tools: string[];
  basePrompt: string;
}

export const MODE_CONFIG: Record<ChatMode, ModeConfig> = {
  chat: {
    label: "Chat",
    description: "Conversation without file access",
    tools: [],
    basePrompt:
      "You are a helpful coding assistant. Answer questions clearly and concisely.",
  },
  plan: {
    label: "Plan",
    description: "Read-only analysis and planning",
    tools: READ_ONLY_TOOLS,
    basePrompt: `You are a coding assistant focused on analysis and planning. You can read files and search the codebase, but you cannot modify any files.

When analyzing code:
- Read relevant files to understand the codebase
- Use grep to find patterns and references
- Provide clear explanations and recommendations
- Suggest implementation approaches without making changes`,
  },
  agent: {
    label: "Agent",
    description: "Full tool access for implementation",
    tools: ALL_TOOL_NAMES,
    basePrompt: `You are a coding agent that helps implement features and fix bugs. You have full access to read, write, and execute commands.

When implementing:
- Read existing code to understand context before making changes
- Make focused, incremental changes
- Explain what you're doing and why
- Test your changes when possible using run_shell`,
  },
};

function createModeStore() {
  const { subscribe, set, update } = writable<ChatMode>("agent");

  return {
    subscribe,
    set,
    setMode: (mode: ChatMode) => set(mode),
    getConfig: (mode: ChatMode) => MODE_CONFIG[mode],
  };
}

export const currentMode = createModeStore();

export function getModeTools(mode: ChatMode): string[] {
  return MODE_CONFIG[mode].tools;
}

export function getModeBasePrompt(mode: ChatMode): string {
  return MODE_CONFIG[mode].basePrompt;
}
