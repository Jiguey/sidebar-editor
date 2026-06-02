# Spec 39 — Context UI Enhancements (Token Breakdown Popover & Compaction Archive)

> **Status:** ✅ Implemented
> **Area:** Chat UI · Context Budget · Compaction
> **Phase:** A — Dogfooding
> **Depends on:** [21-context-compaction.md](21-context-compaction.md) · [08-ai-agent.md](08-ai-agent.md)

> **Note:** This spec documents what was built — not a forward plan. Both features are implemented and live in `ChatPane.svelte`. The purpose of this document is to record the design decisions and implementation details for reference.

---

## 1. Overview

Two UX improvements to the context management surface were implemented together:

1. **Token breakdown popover** — hovering the segmented context bar shows exactly where tokens are going
2. **Compaction archive** — after compaction, the old messages are preserved with an expand/restore UI

Both ship as part of the chat pane UI without new backend changes.

---

## 2. Token Breakdown Popover

### 2.1 Segmented Context Bar

The context bar in the chat footer is a 3px-tall horizontal bar divided into three colored segments proportional to their token usage:

| Segment | Color | Represents |
|---------|-------|-----------|
| System prompt | `#c586c0` (purple) | All content injected into the system prompt |
| Tool schemas | `#ce9178` (orange) | Tool call schema definitions (native tool call mode only) |
| Chat history | `#569cd6` (blue) | The accumulated message history for this session |

Segments are rendered as adjacent `<div>` elements inside the bar container, each with `width` set proportionally to the total context budget. The total used is the sum of all three segments.

### 2.2 Popover Content

Hovering anywhere on the context bar (or the token count numbers adjacent to it) shows a popover positioned above the context footer, right-aligned:

```
┌─────────────────────────────────────────────────────┐
│  System prompt                                 4,821 │
│    Base mode prompt                              821 │
│    Workspace context                           1,240 │
│    Tool instructions                           2,103 │
│    User prompts                                  347 │
│    Skills                                        310 │
│                                                     │
│  Tool schemas                                  2,140 │
│  (Native tool call mode)                            │
│                                                     │
│  Chat history                                 12,540 │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Total used                                   19,501 │
│  Context window                               32,768 │
│  Reply reserve                                 4,096 │
└─────────────────────────────────────────────────────┘
```

- **System prompt total**: the full count for the system prompt block
- **Sub-breakdown**: base mode, workspace context, tool instructions, user prompts, skills — shown as indented sub-rows
- **Tool schemas**: only shown when the active model uses native tool call mode; omitted for text fallback mode
- **Chat history**: total tokens across all messages in the current session history
- **Divider**: visual separator before the totals
- **Total used**: sum of all three segments
- **Context window**: the configured context window for the active model
- **Reply reserve**: the reserved token budget for model replies (subtracted from the window to compute the usable budget)

### 2.3 Derived Values

**`contextBreakdown`** is a derived store in `ChatPane.svelte` that computes all displayed values from the message history and current settings. It recomputes when:
- Message history changes (messages added, compacted, reverted)
- Active model changes (different context window)
- Mode changes (tool schemas appear/disappear)

**`systemBreakdown`** is a sub-derived that computes only the system prompt section breakdown. It is separated from the main breakdown to avoid recomputing the system prompt breakdown on every keystroke in the composer (which would otherwise trigger as the user types, since the composer content does not affect the system prompt).

### 2.4 Popover Behavior

- `pointer-events: none` — the popover does not capture mouse events; it disappears the moment the cursor leaves the bar area
- Position: `bottom: calc(100% + 8px)` above the context footer, `right: 0` aligned to the right edge of the bar
- The popover has no close button and no click interaction — it is purely informational
- Transition: `opacity` fade-in (100ms) on hover enter; immediate hide on hover leave

---

## 3. Compaction Archive

### 3.1 What Is Preserved

When compaction runs (auto or manual), the full pre-compaction message array is preserved alongside the new compacted history. This enables a one-level undo of compaction.

**`ChatSession` interface changes:**

```typescript
interface ChatSession {
  // existing fields...
  compactedAt?: string           // ISO timestamp of last compaction
  compactionCount?: number       // how many times compacted
  preCompactionMessages?: Message[]  // snapshot before last compaction — NEW
}
```

### 3.2 `applyCompaction`

When compaction runs, before replacing the message history:

```typescript
// Save pre-compaction snapshot
session.preCompactionMessages = [...session.messages]
// Replace with compacted history
session.messages = compactedMessages
session.compactedAt = new Date().toISOString()
session.compactionCount = (session.compactionCount ?? 0) + 1
```

Only the **most recent** pre-compaction snapshot is kept. If compaction runs again, `preCompactionMessages` is overwritten with the new pre-compaction state (which is itself the post-compaction state from the first run). There is no multi-level history.

### 3.3 `revertCompaction()`

A method on the chat store:

```typescript
function revertCompaction(sessionId: string): void {
  const session = getSession(sessionId)
  if (!session.preCompactionMessages) return
  session.messages = session.preCompactionMessages
  session.preCompactionMessages = undefined
  session.compactedAt = undefined
  session.compactionCount = Math.max(0, (session.compactionCount ?? 1) - 1)
}
```

This is a complete revert — the full original message history is restored, and the compaction metadata is cleared. After revert, the user can compact again if they choose.

### 3.4 Compaction Divider UI

The divider appears in the message list at the point in the conversation where compaction occurred. It is rendered as a row between the archived messages (above) and the current messages (below):

**Collapsed state (default):**
```
▶  4 archived messages · Restore full context
```

**Expanded state:**
```
▼  4 archived messages · Restore full context

  [archived messages at 45% opacity]

────────────────── end of archive ──────────────────
```

### 3.5 Archive Expansion

**`archiveExpanded`** is a local boolean state in `ChatPane.svelte` (not persisted — resets to collapsed on each load).

Clicking the divider row toggles `archiveExpanded`. The toggle icon (`▶`/`▼`) updates accordingly.

**Archived messages display:**
- Rendered at `opacity: 0.45` to visually distinguish from current messages
- User messages: right-aligned (consistent with normal user message alignment)
- Assistant messages: left-aligned (consistent with normal assistant message alignment)
- Message content: clamped to 3 lines (`-webkit-line-clamp: 3`) with a "..." ellipsis — enough to identify the message without consuming too much space
- Tool calls within archived messages: collapsed by default, not expandable (they are in the archive for context only)

### 3.6 "Restore full context" Button

The "Restore full context" text in the divider row (both collapsed and expanded states) is a clickable link/button:

- Clicking it calls `chat.revertCompaction(currentSessionId)`
- After revert, `archiveExpanded` is reset to false (collapsed)
- The divider row disappears from the message list (no `preCompactionMessages` → no divider)
- The full original message history renders in the message list

If the session has `preCompactionMessages` but `compactedAt` is undefined (edge case from manual store manipulation), the divider still shows with the restore button — the revert action is purely based on `preCompactionMessages` being defined.

---

## 4. Files Modified

Both features live in `ChatPane.svelte` and the chat session types:

| File | What changed |
|------|-------------|
| `src/modules/agent/ChatPane.svelte` | Segmented context bar; `contextBreakdown` and `systemBreakdown` derived stores; breakdown popover; compaction divider; `archiveExpanded` state; archive expand/collapse UI; "Restore full context" handler |
| `src/lib/stores/chat.ts` (or equivalent session store) | `preCompactionMessages` field on `ChatSession`; `revertCompaction()` store method; `applyCompaction` saves snapshot before replacing messages |

---

*Spec created: 2026-06-01 · Documents implementation already in ChatPane.svelte as of 2026-05-30*
