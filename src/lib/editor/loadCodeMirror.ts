import type { OpenFile } from "$lib/stores/files";

export type CodeMirrorKit = {
  EditorState: typeof import("@codemirror/state").EditorState;
  EditorView: typeof import("@codemirror/view").EditorView;
  scrollPastEnd: typeof import("@codemirror/view").scrollPastEnd;
  basicSetup: typeof import("codemirror").basicSetup;
  languageExtensions: Record<string, import("@codemirror/state").Extension>;
};

let loadPromise: Promise<CodeMirrorKit> | null = null;

/** Load CodeMirror once per app session (avoids re-import on every editor remount). */
export function loadCodeMirror(): Promise<CodeMirrorKit> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      import("@codemirror/state"),
      import("@codemirror/view"),
      import("codemirror"),
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-html"),
      import("@codemirror/lang-css"),
      import("@codemirror/lang-json"),
      import("@codemirror/lang-markdown"),
      import("@codemirror/lang-rust"),
      import("@codemirror/lang-python"),
    ]).then(
      ([stateModule, viewModule, setupModule, jsModule, htmlModule, cssModule, jsonModule, mdModule, rustModule, pythonModule]) => ({
        EditorState: stateModule.EditorState,
        EditorView: viewModule.EditorView,
        scrollPastEnd: viewModule.scrollPastEnd,
        basicSetup: setupModule.basicSetup,
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
      })
    );
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
      kit.basicSetup,
      kit.scrollPastEnd(),
      ...lang,
      kit.EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onDocChange(file.path, update.state.doc.toString());
        }
      }),
    ],
  });
}
