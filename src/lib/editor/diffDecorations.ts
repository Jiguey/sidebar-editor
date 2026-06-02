import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

// ── Decorations ────────────────────────────────────────────────────────────

const diffAddLine = Decoration.line({ attributes: { class: "cm-diff-line-add" } });

class DeletionBar extends WidgetType {
  toDOM(): HTMLElement {
    const el = document.createElement("div");
    el.className = "cm-diff-del-marker";
    return el;
  }
  eq() { return true; }
}

const deletionBarWidget = Decoration.widget({
  widget: new DeletionBar(),
  block: true,
  side: -1, // renders before the character at the given position
});

// ── Diff algorithm ─────────────────────────────────────────────────────────

export type LineDiffKind = "same" | "add";

/**
 * LCS-based line diff.
 * Returns:
 *   kinds        — per-new-file-line classification ("same" or "add")
 *   delBefore    — set of 1-based new-file line numbers that have a deletion
 *                  marker *before* them (0 = deletions before line 1).
 */
export function diffLineKinds(
  oldText: string,
  newText: string
): { kinds: LineDiffKind[]; delBefore: Set<number> } {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const n = oldLines.length;
  const m = newLines.length;

  // LCS DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Trace back
  const kinds: LineDiffKind[] = new Array(m).fill("add");
  const delBefore = new Set<number>();
  let i = n;
  let j = m;
  // pendingDel: we saw old-line deletions at "current j" during trace-back.
  // Once j decrements (or we finish), those deletions belong before line j+1.
  let pendingDel = false;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      if (pendingDel) { delBefore.add(j + 1); pendingDel = false; }
      kinds[j - 1] = "same";
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      if (pendingDel) { delBefore.add(j + 1); pendingDel = false; }
      // kinds[j-1] stays "add"
      j--;
    } else {
      // Old line deleted — track for marker
      pendingDel = true;
      i--;
    }
  }
  // Deletions that happened before new line 1 (or in an empty new file)
  if (pendingDel) delBefore.add(1);

  return { kinds, delBefore };
}

// ── Decoration builder ─────────────────────────────────────────────────────

function buildDiffDecorations(view: EditorView, diffBase: string): DecorationSet {
  const doc = view.state.doc;
  const { kinds, delBefore } = diffLineKinds(diffBase, doc.toString());
  const lineCount = doc.lines;

  // Collect all (from, decoration) pairs then sort so RangeSetBuilder is happy
  type Entry = { from: number; widget: boolean; dec: Decoration };
  const entries: Entry[] = [];

  for (let li = 0; li < Math.min(kinds.length, lineCount); li++) {
    if (kinds[li] === "add") {
      const line = doc.line(li + 1);
      entries.push({ from: line.from, widget: false, dec: diffAddLine });
    }
  }

  for (const lineNum of delBefore) {
    const clamped = Math.max(1, Math.min(lineNum, lineCount));
    const pos = doc.line(clamped).from;
    entries.push({ from: pos, widget: true, dec: deletionBarWidget });
  }

  // Sort: ascending position; widgets before line decorations at same position
  entries.sort((a, b) => a.from - b.from || (a.widget ? -1 : 1));

  const builder = new RangeSetBuilder<Decoration>();
  for (const e of entries) {
    builder.add(e.from, e.from, e.dec);
  }
  return builder.finish();
}

// ── ViewPlugin ─────────────────────────────────────────────────────────────

/** Highlight added lines (green) and mark deleted positions (red bar). */
export function gitDiffHighlightExtension(getDiffBase: () => string | undefined) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;

      constructor(view: EditorView) {
        this.decorations = this.build(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.build(update.view);
        }
      }

      build(view: EditorView) {
        const base = getDiffBase();
        if (base === undefined) return Decoration.none;
        return buildDiffDecorations(view, base);
      }
    },
    { decorations: (v) => v.decorations }
  );
}
