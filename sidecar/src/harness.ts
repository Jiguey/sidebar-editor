import type { HarnessConfig, HarnessEvent, ChatMessage, ToolDefinition } from "./types.js";

export interface Harness {
  start(config: HarnessConfig): Promise<void>;
  send(message: string, history: ChatMessage[], signal?: AbortSignal): AsyncGenerator<HarnessEvent>;
  stop(): void;
  getTools(): ToolDefinition[];
}

export abstract class BaseHarness implements Harness {
  protected config: HarnessConfig | null = null;
  protected tools: ToolDefinition[] = [];

  async start(config: HarnessConfig): Promise<void> {
    this.config = config;
    this.tools = this.defineTools();
  }

  abstract send(message: string, history: ChatMessage[], signal?: AbortSignal): AsyncGenerator<HarnessEvent>;

  stop(): void {
    this.config = null;
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  protected defineTools(): ToolDefinition[] {
    return [
      {
        name: "read_file",
        description: "Read the contents of a file at the given path",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "The file path to read" },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write contents to a file at the given path",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "The file path to write to" },
            content: { type: "string", description: "The content to write" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "list_dir",
        description: "List files and directories in a given path",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "The directory path to list" },
          },
          required: ["path"],
        },
      },
      {
        name: "run_command",
        description: "Run a shell command in the workspace",
        inputSchema: {
          type: "object",
          properties: {
            command: { type: "string", description: "The command to run" },
          },
          required: ["command"],
        },
      },
    ];
  }
}
