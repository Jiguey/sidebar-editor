/**
 * Pure mapping from harness IPC events to streaming assistant text / final bubble.
 * Keeps {@link import('../components/ChatPane.svelte')} behavior testable without Tauri.
 */

export type HarnessStreamView = {
  streamingContent: string;
  streamingThinking: string;
};

export type HarnessStreamAction =
  | { kind: "set-stream"; view: HarnessStreamView }
  | {
      kind: "commit-assistant";
      view: HarnessStreamView;
      content: string;
      thinking?: string;
    }
  | { kind: "clear-stream" }
  | { kind: "error-assistant"; message: string }
  | { kind: "noop" };

function asThinkingPayload(data: unknown): { content?: string } | null {
  if (!data || typeof data !== "object") return null;
  return data as { content?: string };
}

function asMessagePayload(data: unknown): { content?: string; done?: boolean } | null {
  if (!data || typeof data !== "object") return null;
  return data as { content?: string; done?: boolean };
}

/**
 * How the chat pane should update streaming buffers (and optionally commit one assistant message).
 */
export function reduceHarnessStreamDisplay(
  prev: HarnessStreamView,
  eventType: string,
  data: unknown
): HarnessStreamAction {
  if (eventType === "stopped") {
    return { kind: "clear-stream" };
  }

  if (eventType === "thinking") {
    const t = asThinkingPayload(data);
    if (typeof t?.content !== "string") return { kind: "noop" };
    return {
      kind: "set-stream",
      view: { streamingContent: prev.streamingContent, streamingThinking: t.content },
    };
  }

  if (eventType === "message") {
    const msg = asMessagePayload(data);
    const content = typeof msg?.content === "string" ? msg.content : "";
    const done = msg?.done === true;
    if (!done) {
      return {
        kind: "set-stream",
        view: { streamingContent: content, streamingThinking: prev.streamingThinking },
      };
    }
    const think = prev.streamingThinking.trim();
    return {
      kind: "commit-assistant",
      view: { streamingContent: "", streamingThinking: "" },
      content,
      ...(think ? { thinking: think } : {}),
    };
  }

  if (eventType === "error") {
    const d = data as { message?: string };
    const msg = d?.message ?? (typeof data === "string" ? data : JSON.stringify(data));
    return { kind: "error-assistant", message: msg };
  }

  return { kind: "noop" };
}
