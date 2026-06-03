# Spec 32 — Agent Error Recovery

> **Status:** ✅ Implemented — web_fetch retry (1 attempt, 500ms backoff, retryable detection), "Continue for N more steps" notice UI, "stopped" badge on aborted tool chips, toast on exhausted retries. Shell process kill (§6.4) deferred — run_shell already has a 30s timeout.
> **Area:** Agent Loop · Tool Execution · UX
> **Phase:** B — Enhancement
> **Depends on:** [08-ai-agent.md](08-ai-agent.md) · [09-tool-system.md](09-tool-system.md) · [12-ipc.md](12-ipc.md)

---

## 1. Overview

Currently the agent has no explicit error recovery strategy. When a tool fails, the error string is appended as a tool result and the agent continues — which is partially correct, but the behavior is inconsistent. Network failures are not retried, max-steps termination gives no continuation path, and abort cleanup is not deterministic.

This spec defines:

- How tool errors are formatted for the model vs surfaced to the user
- Automatic retry for transient network failures
- A "Continue" UX when `maxAgentSteps` is hit
- Abort cleanup when the user clicks Stop
- Error toasts vs inline messages — which is used for which

---

## 2. Current State

- `executeToolCallsWithApproval` in `ChatPane.svelte` runs tools sequentially
- On error, `toolRunner.ts` returns an error string; it becomes the tool result message
- No retry logic exists anywhere in the agent loop
- No cleanup is performed on abort beyond stopping the stream
- `agentLimits.ts` defines `maxAgentSteps`, `maxToolCallsPerRun`, `maxToolsPerTurn` (all 0 = unlimited)
- When `maxAgentSteps` is hit, the loop stops silently with a message; there is no UI to continue

---

## 3. Error Categories

### 3.1 Tool Execution Errors

| Error type | Example | Recovery action |
|------------|---------|-----------------|
| Rust IPC failure | `invoke()` throws, Tauri command panics | Return error to model as tool result |
| Permission denied | File outside workspace, OS permission | Return error to model as tool result |
| File not found | `read_file` on missing path | Return error to model as tool result |
| Tool timeout | Shell command exceeds max runtime | Kill the process, return timeout error to model |
| `web_fetch` network error | DNS failure, connection refused | 1 automatic retry (see §5); then return error to model |
| Policy deny | Tool not allowed in current mode | Return policy error; do not surface to user as a toast |

Tool execution errors are **not retried** (except `web_fetch` network errors — §5). The error string is returned to the model as a structured tool result so the model can decide how to proceed. The model may call the tool again with different parameters, skip the step, or ask the user for clarification.

### 3.2 Error Message Format

Tool result errors sent to the model:

```
Error: <category> — <detail>

Examples:
Error: permission_denied — Path '/etc/passwd' is outside the workspace root.
Error: file_not_found — No file at 'src/missing.ts'.
Error: timeout — Shell command exceeded 30s limit.
Error: network_error — Failed to fetch https://example.com: connection refused. (retried once)
```

The format is intentionally plain prose — not JSON — because most models handle embedded error prose better than structured error objects within tool results.

### 3.3 Error Message Format for the User

The user sees errors differently from the model:

| Error | What the user sees |
|-------|--------------------|
| Tool runtime error | Error text shown inside the `ToolCallCard` (collapsible, red status badge) |
| `web_fetch` exhausted retries | Inline error in `ToolCallCard` + a toast: "Network error — fetch failed after retry" |
| Max steps hit | Inline message in chat + "Continue" button (§4) |
| Context budget exceeded | Inline blocking message (existing `contextBudgetStopMessage`) |
| Abort by user | No error shown; tool cards that were in-progress get a "Stopped" status badge |

**Toast vs inline rule:**
- **Toast**: used only for errors that have no inline home — i.e. errors that happen outside a running tool call (e.g. retried `web_fetch` exhausting attempts). Toasts auto-dismiss after 5 seconds.
- **Inline**: all tool execution errors render inside their `ToolCallCard`. Agent-loop-level errors (max steps, context budget) render as inline chat messages. Inline errors do not auto-dismiss.

---

## 4. Max Steps — "Continue" UX

### 4.1 Trigger

When `maxAgentSteps > 0` and the loop hits the cap, instead of silently ending, the agent appends a message to the chat:

```
Agent paused — reached the limit of N steps.
[Continue for N more steps]   [Stop here]
```

The "Continue for N more steps" button is the same value as `maxAgentSteps` (e.g. if the limit is 10, the button says "Continue for 10 more steps"). Clicking it resumes the agent loop with a fresh step counter starting from 0, carrying the same history and tool results.

"Stop here" dismisses the buttons and leaves the chat in its current state. If the user takes no action and sends a new message instead, the buttons are also dismissed.

### 4.2 Implementation

`ChatPane.svelte` — after the step cap is hit, emit a synthetic `assistant` message of type `step_limit_reached` (or a special metadata field). The chat renderer shows the continue/stop UI for this message type. Clicking "Continue" calls `runAgentLoop()` again from the current history position with `remainingSteps` reset.

The `continueAgentRun` action in the agent loop should accept an optional `stepOverride` parameter that bypasses the stored `maxAgentSteps` for one run.

### 4.3 When maxAgentSteps = 0

When the limit is 0 (unlimited), this UI never appears. The "Continue" UX is only shown when a non-zero step limit is configured.

---

## 5. Network Failure Retry

### 5.1 Scope

Only `web_fetch` tool calls are automatically retried. Filesystem tool failures are not retried (they indicate a real problem the model needs to handle).

### 5.2 Retry Policy

| Parameter | Value |
|-----------|-------|
| Max automatic retries | 1 |
| Backoff | 500ms fixed delay |
| Retryable conditions | Connection refused, DNS failure, timeout (HTTP 5xx are **not** retried — the response content is returned to the model) |
| Non-retryable | Permission errors, hostname not in allowlist, malformed URL |

After 1 retry, if the request still fails, the error is returned to the model as a tool result and a toast is shown to the user (§3.3).

### 5.3 Implementation

In `toolRunner.ts`, the `web_fetch` handler wraps the IPC call:

```typescript
async function fetchWithRetry(url: string, options: FetchOptions, maxRetries = 1): Promise<string> {
  let lastError: Error
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(500)
    try {
      return await ipc.webFetch(url, options)
    } catch (e) {
      if (!isRetryable(e)) throw e
      lastError = e as Error
    }
  }
  throw lastError!
}
```

`isRetryable` checks the error message for network-layer signals (connection refused, ETIMEDOUT, DNS resolution failure). HTTP errors pass through — the response body is returned.

---

## 6. Abort Behavior

### 6.1 Trigger

The user clicks the Stop button in the chat composer during an agent run.

### 6.2 What Gets Cleaned Up

| Resource | Cleanup action |
|----------|----------------|
| LLM stream | Abort via `AbortController` signal (existing) |
| In-progress tool call | Mark `ToolCallCard` status as `"stopped"` |
| Pending tool calls (queued but not started) | Drop; not executed |
| Shell processes spawned by `run_shell` | Send SIGTERM via Tauri command `kill_process` (new IPC) |
| File writes in progress | Not interrupted — Rust completes the write atomically before the IPC returns. Partial writes are not possible in the current model. |
| Agent loop state | `isRunning` set to false; `abortController.abort()` called |

### 6.3 Post-Abort State

After abort, the chat is left in a consistent state:
- Partial assistant message (if stream was mid-flight) is kept but marked with a "Stopped" badge
- Tool results received before the abort are kept in history
- Tool calls that were in-flight when Stop was pressed show "Stopped" status
- The user can immediately send a new message — the next run starts fresh

### 6.4 Shell Process Cleanup

A new Tauri command `kill_agent_processes` is added to `filesystem.rs`. It maintains a running set of child PIDs spawned by `run_shell` during the current agent turn. On abort, `ChatPane.svelte` calls this command to terminate any lingering processes.

---

## 7. Error Toasts

Toasts are used sparingly. Toast rules:

| Condition | Toast shown? | Message |
|-----------|-------------|---------|
| Tool execution error | No — inline in ToolCallCard | — |
| `web_fetch` exhausted retries | Yes | "Network error — fetch failed after retry" |
| Rust IPC invocation error (outside tool context) | Yes | "Internal error — [short message]" |
| Abort by user | No | — |
| Max steps hit | No — inline in chat | — |

Toasts auto-dismiss after 5 seconds. A maximum of 3 toasts stack at once; older toasts are pushed out.

---

## 8. Files to Change

| File | Change |
|------|--------|
| `src/lib/tools/toolRunner.ts` | Add `fetchWithRetry`, `isRetryable`, per-tool error formatting, `kill_agent_processes` call on abort |
| `src/modules/agent/ChatPane.svelte` | Step-limit "Continue" button logic, abort cleanup, `StepLimitMessage` chat element |
| `src/lib/agentLimits.ts` | No schema change — existing fields sufficient; add JSDoc for step-limit UX behavior |
| `src/lib/ipc.ts` | Add `killAgentProcesses()` wrapper for new Rust command |
| `src-tauri/src/modules/filesystem.rs` | Add `kill_agent_processes` command, child PID registry |

---

*Spec created: 2026-06-01*
