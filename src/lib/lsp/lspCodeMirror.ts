/**
 * CodeMirror extensions for LSP diagnostics and hover (spec 25 §4).
 *
 * - `lspDiagnosticsExtension(getClient)` — a Compartment-reconfigurable
 *   linter + hover tooltip wired to an LspClient.
 * - `applyLspDiagnostics(view, diagnostics)` — push new diagnostics into
 *   an already-mounted editor view without rebuilding the state.
 */
import type { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { Diagnostic as CmDiagnostic } from "@codemirror/lint";
import type { Diagnostic as LspDiagnostic, Hover } from "./lspProtocol";
import { DiagnosticSeverity } from "./lspProtocol";
import type { LspClient } from "./lspClient";

// ---------------------------------------------------------------------------
// Severity mapping
// ---------------------------------------------------------------------------

export function lspSeverityToCm(severity: number | undefined): CmDiagnostic["severity"] {
  switch (severity) {
    case DiagnosticSeverity.Warning: return "warning";
    case DiagnosticSeverity.Information:
    case DiagnosticSeverity.Hint: return "info";
    default: return "error";
  }
}

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------

function lspPosToOffset(doc: EditorView["state"]["doc"], line: number, character: number): number {
  const lineObj = doc.line(Math.min(line + 1, doc.lines));
  return Math.min(lineObj.from + character, lineObj.to);
}

// ---------------------------------------------------------------------------
// Push diagnostics into a live EditorView
// ---------------------------------------------------------------------------

/** Called whenever the server emits `textDocument/publishDiagnostics`. */
export async function applyLspDiagnostics(
  view: EditorView,
  diags: LspDiagnostic[],
): Promise<void> {
  const { setDiagnosticsEffect } = await import("@codemirror/lint");
  const mapped: CmDiagnostic[] = diags.map((d) => {
    const from = lspPosToOffset(view.state.doc, d.range.start.line, d.range.start.character);
    const to = lspPosToOffset(view.state.doc, d.range.end.line, d.range.end.character);
    return {
      from: Math.min(from, to),
      to: Math.max(from, to),
      severity: lspSeverityToCm(d.severity),
      message: d.message,
      source: d.source,
    };
  });
  view.dispatch({ effects: setDiagnosticsEffect.of(mapped) });
}

// ---------------------------------------------------------------------------
// Hover tooltip extension
// ---------------------------------------------------------------------------

export function hoverContentsToString(h: Hover): string {
  const c = h.contents;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((x) => (typeof x === "string" ? x : x.value)).join("\n\n");
  if (typeof c === "object" && "value" in c) return c.value;
  return "";
}

/**
 * Returns a CodeMirror hover tooltip extension backed by an LspClient.
 * Lazy-imports `@codemirror/view` to stay in the on-demand chunk.
 */
export async function lspHoverExtension(
  client: LspClient,
  fileUri: string,
): Promise<Extension> {
  const { hoverTooltip } = await import("@codemirror/view");
  return hoverTooltip(async (view, pos) => {
    const line = view.state.doc.lineAt(pos);
    const lineNum = line.number - 1; // LSP is 0-based
    const character = pos - line.from;
    const result = await client.hover(fileUri, { line: lineNum, character });
    if (!result) return null;
    const text = hoverContentsToString(result);
    if (!text) return null;
    return {
      pos,
      above: true,
      create() {
        const dom = document.createElement("div");
        dom.className = "cm-lsp-hover";
        dom.textContent = text;
        return { dom };
      },
    };
  });
}
