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
import { StreamLanguage, foldGutter, indentOnInput, bracketMatching } from "@codemirror/language";
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
import { editorSyntaxHighlighting } from "./syntaxTheme";
import { middleClickScroll } from "./middleClickScroll";

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
  middleClickScroll(),
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
  /** Grammar for an already-resolved language, or null if not loaded yet / unsupported. */
  getLoadedLanguage(language: string): Extension | null;
  /** Dynamically import a language grammar (once), caching the resolved extension. */
  loadLanguage(language: string): Promise<Extension | null>;
};

/**
 * One dynamic import per language. Each loader is the only static reference to its
 * grammar package, so Vite emits a separate async chunk per language — opening a
 * `.py` file pulls Python's grammar, not all 27. See `manualChunks` in vite.config.ts.
 */
const languageLoaders: Record<string, () => Promise<Extension>> = {
  javascript: async () => (await import("@codemirror/lang-javascript")).javascript(),
  typescript: async () =>
    (await import("@codemirror/lang-javascript")).javascript({ typescript: true }),
  jsx: async () => (await import("@codemirror/lang-javascript")).javascript({ jsx: true }),
  tsx: async () =>
    (await import("@codemirror/lang-javascript")).javascript({ typescript: true, jsx: true }),
  html: async () => (await import("@codemirror/lang-html")).html(),
  css: async () => (await import("@codemirror/lang-css")).css(),
  json: async () => (await import("@codemirror/lang-json")).json(),
  markdown: async () => (await import("@codemirror/lang-markdown")).markdown(),
  rust: async () => (await import("@codemirror/lang-rust")).rust(),
  python: async () => (await import("@codemirror/lang-python")).python(),
  yaml: async () => (await import("@codemirror/lang-yaml")).yaml(),
  go: async () => (await import("@codemirror/lang-go")).go(),
  cpp: async () => (await import("@codemirror/lang-cpp")).cpp(),
  c: async () => (await import("@codemirror/lang-cpp")).cpp(),
  java: async () => (await import("@codemirror/lang-java")).java(),
  sql: async () => (await import("@codemirror/lang-sql")).sql(),
  xml: async () => (await import("@codemirror/lang-xml")).xml(),
  svelte: async () => (await import("codemirror-lang-svelte")).svelte(),
  vue: async () => (await import("@codemirror/lang-html")).html(),
  php: async () => (await import("@codemirror/lang-php")).php(),
  shell: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/shell")).shell),
  toml: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/toml")).toml),
  ruby: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/ruby")).ruby),
  kotlin: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/clike")).kotlin),
  csharp: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/clike")).csharp),
  scala: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/clike")).scala),
  dart: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/clike")).dart),
  lua: async () => StreamLanguage.define((await import("@codemirror/legacy-modes/mode/lua")).lua),
  dockerfile: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/dockerfile")).dockerFile),
  powershell: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/powershell")).powerShell),
  perl: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/perl")).perl),
  swift: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/swift")).swift),
  haskell: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/haskell")).haskell),
  r: async () => StreamLanguage.define((await import("@codemirror/legacy-modes/mode/r")).r),
  groovy: async () =>
    StreamLanguage.define((await import("@codemirror/legacy-modes/mode/groovy")).groovy),
};

/** Resolved grammars (value `null` = no grammar for this language; don't retry). */
const loadedLanguages = new Map<string, Extension | null>();
/** De-dupes concurrent loads of the same language. */
const inflightLanguages = new Map<string, Promise<Extension | null>>();

function getLoadedLanguage(language: string): Extension | null {
  return loadedLanguages.get(language) ?? null;
}

function loadLanguage(language: string): Promise<Extension | null> {
  const cached = loadedLanguages.get(language);
  if (cached !== undefined) return Promise.resolve(cached);
  const inflight = inflightLanguages.get(language);
  if (inflight) return inflight;

  const loader = languageLoaders[language];
  if (!loader) {
    loadedLanguages.set(language, null);
    return Promise.resolve(null);
  }

  const promise = loader()
    .then((ext) => {
      loadedLanguages.set(language, ext);
      inflightLanguages.delete(language);
      return ext;
    })
    .catch((err) => {
      console.error(`Failed to load CodeMirror grammar for "${language}"`, err);
      loadedLanguages.set(language, null);
      inflightLanguages.delete(language);
      return null;
    });
  inflightLanguages.set(language, promise);
  return promise;
}

let loadPromise: Promise<CodeMirrorKit> | null = null;

/** Load the CodeMirror core once per app session. Language grammars load on demand. */
export function loadCodeMirror(): Promise<CodeMirrorKit> {
  if (!loadPromise) {
    loadPromise = Promise.resolve({
      EditorState,
      EditorView,
      scrollPastEnd,
      editorBaseSetup,
      syntaxHighlighting: editorSyntaxHighlighting,
      getLoadedLanguage,
      loadLanguage,
    });
  }
  return loadPromise;
}
