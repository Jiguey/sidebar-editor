import type { Extension } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
  EditorView,
  scrollPastEnd,
} from "@codemirror/view";
import { foldGutter, indentOnInput, bracketMatching } from "@codemirror/language";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { foldKeymap } from "@codemirror/language";
import type { OpenFile } from "$lib/stores/files";
import { editorSyntaxHighlighting } from "./syntaxTheme";

/** Same as codemirror's `basicSetup` but without `defaultHighlightStyle` (we use custom syntax). */
export const editorBaseSetup: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
];

export type CodeMirrorKit = {
  EditorState: typeof EditorState;
  EditorView: typeof EditorView;
  scrollPastEnd: typeof scrollPastEnd;
  editorBaseSetup: Extension[];
  syntaxHighlighting: Extension;
  languageExtensions: Record<string, Extension>;
};

let loadPromise: Promise<CodeMirrorKit> | null = null;

/** Load CodeMirror once per app session (avoids re-import on every editor remount). */
export function loadCodeMirror(): Promise<CodeMirrorKit> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-html"),
      import("@codemirror/lang-css"),
      import("@codemirror/lang-json"),
      import("@codemirror/lang-markdown"),
      import("@codemirror/lang-rust"),
      import("@codemirror/lang-python"),
    ]).then(([jsModule, htmlModule, cssModule, jsonModule, mdModule, rustModule, pythonModule]) => ({
      EditorState,
      EditorView,
      scrollPastEnd,
      editorBaseSetup,
      syntaxHighlighting: editorSyntaxHighlighting,
      languageExtensions: {
        javascript: jsModule.javascript(),
        typescript: jsModule.javascript({ typescript: true }),
        html: htmlModule.html(),
        css: cssModule.css(),
        json: jsonModule.json(),
        markdown: mdModule.markdown(),
        rust: rustModule.rust(),
        python: pythonModule.python(),
      },
    }));
  }
  return loadPromise;
}

export function createEditorState(
  kit: CodeMirrorKit,
  file: OpenFile,
  onDocChange: (path: string, text: string) => void
) {
  const langExt = kit.languageExtensions[file.language];
  const lang = langExt != null ? [langExt] : [];
  return kit.EditorState.create({
    doc: file.content,
    extensions: [
      ...kit.editorBaseSetup,
      ...lang,
      kit.syntaxHighlighting,
      kit.scrollPastEnd(),
      kit.EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onDocChange(file.path, update.state.doc.toString());
        }
      }),
    ],
  });
}
