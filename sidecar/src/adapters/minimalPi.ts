import { PiAdapter } from "./pi.js";
import type { ToolDefinition } from "../types.js";

/**
 * Pi-style routing with a reduced tool surface (read-only exploration).
 * Same model path as {@link PiAdapter}; only tool definitions differ.
 */
export class MinimalPiAdapter extends PiAdapter {
  protected override defineTools(): ToolDefinition[] {
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
    ];
  }
}
