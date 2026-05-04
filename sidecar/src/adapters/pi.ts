import { BaseHarness } from "../harness.js";
import { getProvider } from "../models/router.js";
import type { ChatMessage, HarnessEvent } from "../types.js";

/**
 * Pi-style adapter that uses our model router.
 * In the future, this can be swapped to import the actual Pi SDK:
 * import { Pi } from "@mariozechner/pi-coding-agent";
 * 
 * For now, we implement a simplified version that follows Pi's philosophy:
 * - Minimal tools (read, write, edit, bash)
 * - Let the model do the work
 */
export class PiAdapter extends BaseHarness {
  async *send(
    message: string,
    history: ChatMessage[],
    signal?: AbortSignal
  ): AsyncGenerator<HarnessEvent> {
    if (!this.config) {
      yield { type: "error", message: "Harness not started" };
      return;
    }

    const provider = getProvider(this.config);
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    yield* provider.chat(messages, this.tools, this.config, signal);
  }
}
