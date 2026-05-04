import * as readline from "readline";
import { submitToolDecision } from "./approvalGate.js";
import { createHarness, normalizeHarnessKind } from "./harnessFactory.js";
import { readBundledPiSdkVersion } from "./piSdkMeta.js";
import type { Harness } from "./harness.js";
import type { RpcRequest, RpcEvent, ChatMessage, HarnessConfig } from "./types.js";

let harness: Harness | null = null;
let activeHarnessKind = "";
/** In-flight chat only; abort does not tear down the harness. */
let chatAbort: AbortController | null = null;

/** Serialize start / clear / approve / stop so they never race each other. */
let nonChatChain = Promise.resolve();

function emit(event: RpcEvent): void {
  console.log(JSON.stringify(event));
}

function enqueueNonChat(task: () => Promise<void>): void {
  nonChatChain = nonChatChain.then(task).catch((err) => {
    console.error(JSON.stringify({ id: 0, event: "error", data: { message: String(err) } }));
  });
}

async function handleChatRequest(req: RpcRequest): Promise<void> {
  const { id, params } = req;
  try {
    const message = params.message as string;
    const history = (params.history as ChatMessage[] | undefined) ?? [];
    if (!harness) {
      emit({ id, event: "error", data: { message: "Harness not started" } });
      return;
    }

    chatAbort?.abort();
    const myAbort = new AbortController();
    chatAbort = myAbort;
    const signal = myAbort.signal;

    try {
      for await (const event of harness.send(message, history, signal)) {
        emit({ id, event: event.type, data: event });
      }
    } catch (error) {
      if (!signal.aborted) {
        emit({
          id,
          event: "error",
          data: { message: error instanceof Error ? error.message : String(error) },
        });
      }
    } finally {
      if (signal.aborted) {
        emit({ id, event: "stopped", data: { reason: "aborted" } });
      }
      if (chatAbort === myAbort) {
        chatAbort = null;
      }
    }
  } catch (error) {
    emit({
      id,
      event: "error",
      data: { message: error instanceof Error ? error.message : String(error) },
    });
  }
}

async function handleNonChatRequest(req: RpcRequest): Promise<void> {
  const { id, method, params } = req;

  try {
    switch (method) {
      case "start": {
        const config = params as unknown as HarnessConfig;
        const want = normalizeHarnessKind(config.harnessKind);
        if (!harness || activeHarnessKind !== want) {
          harness?.stop();
          harness = createHarness(want);
          activeHarnessKind = want;
        }
        await harness.start({ ...config, harnessKind: want });
        const piPackageVersion = await readBundledPiSdkVersion();
        emit({
          id,
          event: "started",
          data: {
            tools: harness.getTools(),
            harnessKind: want,
            piPackageVersion,
          },
        });
        break;
      }

      case "clear": {
        emit({ id, event: "cleared", data: {} });
        break;
      }

      case "approve_tool": {
        const callId = params.callId as string;
        const approved = Boolean(params.approved);
        submitToolDecision(callId, approved);
        emit({ id, event: "tool_decision", data: { callId, approved } });
        break;
      }

      default:
        emit({ id, event: "error", data: { message: `Unknown method: ${method}` } });
    }
  } catch (error) {
    emit({
      id,
      event: "error",
      data: { message: error instanceof Error ? error.message : String(error) },
    });
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => {
  try {
    const req = JSON.parse(line) as RpcRequest;
    // Must not queue behind `start` — otherwise cancel waits and the UI never stops.
    if (req.method === "stop") {
      chatAbort?.abort();
      emit({ id: req.id, event: "stopped", data: { reason: "user_cancel" } });
      return;
    }
    if (req.method === "chat") {
      void handleChatRequest(req);
    } else {
      enqueueNonChat(() => handleNonChatRequest(req));
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        id: 0,
        event: "error",
        data: { message: `Failed to parse request: ${error}` },
      })
    );
  }
});

// Signal ready
console.log(JSON.stringify({ id: 0, event: "ready", data: {} }));
