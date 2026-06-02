# Spec 34 — Context Overflow Warnings

> **Status:** ❌ Not started
> **Area:** Chat UI · Context Budget · UX
> **Phase:** B — Enhancement
> **Depends on:** [21-context-compaction.md](21-context-compaction.md) · [08-ai-agent.md](08-ai-agent.md) · [39-context-ui-enhancements.md](39-context-ui-enhancements.md)

---

## 1. Overview

The context bar (segmented purple/orange/blue bar in the chat footer — see [39-context-ui-enhancements.md](39-context-ui-enhancements.md)) already exists and shows usage vs the context window. This spec adds **color-coded states** to signal usage levels to the user before the agent loop terminates on them.

Three states drive UI changes:

| State | Threshold | Meaning |
|-------|-----------|---------|
| **Healthy** | < 70% of `contextBudgetLimit` | Normal operation |
| **Warning** | 70–90% | Getting full; compaction may be needed soon |
| **Critical** | > 90% | Near the point where the agent will stop |

The `contextBudgetLimit` is the active context window minus the reply reserve (existing definition in `contextBudget.ts`).

---

## 2. Visual Changes by State

### 2.1 Healthy State (< 70%)

No changes from current implementation. The segmented bar uses its existing colors:
- System prompt segment: `#c586c0` (purple)
- Tool schemas segment: `#ce9178` (orange)
- Chat history segment: `#569cd6` (blue)

The `context-numbers` text uses the existing muted color.

### 2.2 Warning State (70–90%)

- The entire context bar shifts to a **solid amber** color (`#d4a017`) instead of the three-color segmented display. The amber bar fills proportionally to match actual usage percentage.
- The `context-numbers` text (e.g. "42k / 64k") changes to amber: `color: #d4a017`
- No popup or toast — the color change is the signal

Rationale for dropping segmentation in warning/critical: when the bar is amber or red, the breakdown is less useful than the immediate "you need to act" signal. The breakdown popover is still available on hover.

### 2.3 Critical State (> 90%)

- Bar color: `#f44747` (red), same fill-proportional behavior
- `context-numbers` text: `color: #f44747`
- An inline warning block appears **above the composer** (between the message list and the composer input):

```
┌─────────────────────────────────────────────────────────┐
│  ⚠  Context almost full — consider compacting or        │
│     starting a new chat.          [Compact now]         │
└─────────────────────────────────────────────────────────┘
```

The warning block:
- Is dismissible (× button on the right)
- Re-appears if the user dismisses it and context stays critical
- The "Compact now" button triggers manual compaction (same action as the spark icon in the footer)
- The "Compact now" button is disabled and shows "Compaction off" if compaction is disabled in settings
- Dismissed state resets when context drops back below 90% and rises above 90% again

### 2.4 Agent Blocked State (`isAgentContextBudgetExceeded`)

When `isAgentContextBudgetExceeded` is true (existing flag in the agent loop — the context already exceeds the send budget), the composer input is disabled and the existing `contextBudgetStopMessage` inline message is shown. This is not a new behavior — this spec documents the relationship between the three warning states and this existing blocked state for completeness.

The blocked state is a fourth condition, beyond critical. The progression is:
healthy → warning → critical → blocked (agent cannot start a turn).

---

## 3. Helper: `contextUsageLevel()`

Add a new helper to `contextBudget.ts`:

```typescript
export type ContextUsageLevel = 'healthy' | 'warning' | 'critical'

export function contextUsageLevel(used: number, budgetLimit: number): ContextUsageLevel {
  if (budgetLimit <= 0) return 'healthy'  // no budget configured
  const ratio = used / budgetLimit
  if (ratio >= 0.90) return 'critical'
  if (ratio >= 0.70) return 'warning'
  return 'healthy'
}
```

This function is pure and unit-testable. It is called in `ChatPane.svelte` as a derived value:

```typescript
$: usageLevel = contextUsageLevel($contextUsed, $contextBudgetLimit)
```

---

## 4. CSS Changes

### 4.1 Context Bar

Add CSS classes to the `.context-bar` element driven by `usageLevel`:

```css
.context-bar.warning {
  /* Override segmented colors with solid amber */
  background: #d4a017;
}

.context-bar.critical {
  background: #f44747;
}
```

In the Svelte template, conditionally apply the class and suppress the per-segment rendering when in warning/critical:

```svelte
<div
  class="context-bar"
  class:warning={usageLevel === 'warning'}
  class:critical={usageLevel === 'critical'}
>
  {#if usageLevel === 'healthy'}
    <!-- existing segmented bars -->
  {:else}
    <!-- solid bar at full width, color applied via class -->
    <div class="context-bar-fill" style="width: {usagePct}%"></div>
  {/if}
</div>
```

### 4.2 Context Numbers

```css
.context-numbers.warning { color: #d4a017; }
.context-numbers.critical { color: #f44747; }
```

### 4.3 Inline Warning Block

New CSS for the warning block above the composer:

```css
.context-overflow-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(244, 71, 71, 0.08);
  border-top: 1px solid rgba(244, 71, 71, 0.25);
  font-size: 12px;
  color: #f44747;
}

.context-overflow-warning button.compact-now {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid rgba(244, 71, 71, 0.4);
  border-radius: 3px;
  background: transparent;
  color: #f44747;
  cursor: pointer;
}

.context-overflow-warning button.compact-now:disabled {
  opacity: 0.4;
  cursor: default;
}

.context-overflow-warning .dismiss {
  margin-left: 4px;
  opacity: 0.6;
  cursor: pointer;
}
```

---

## 5. Files to Change

| File | Change |
|------|--------|
| `src/lib/agent/contextBudget.ts` | Add `contextUsageLevel()` helper and `ContextUsageLevel` type |
| `src/modules/agent/ChatPane.svelte` | Derive `usageLevel`; apply `.warning`/`.critical` classes to bar and numbers; add inline warning block above composer; handle dismiss state |

No other files need to change. The context bar and numbers already exist in `ChatPane.svelte`; this spec adds conditional CSS classes and a new DOM element.

---

*Spec created: 2026-06-01*
