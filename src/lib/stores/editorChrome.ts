import { writable, get } from "svelte/store";
import {
  applyEditorChromeToDocument,
  clearEditorChromeInlineOverrides,
  defaultEditorChrome,
  loadEditorChrome,
  readEditorChromeFromDocument,
  saveEditorChrome,
  type EditorChromeMap,
} from "../editor/editorChrome";

function createEditorChromeStore() {
  const { subscribe, set, update } = writable<EditorChromeMap>(loadEditorChrome());

  return {
    subscribe,
    get: () => get({ subscribe }),

    init() {
      const colors = loadEditorChrome();
      set(colors);
      applyEditorChromeToDocument(colors);
    },

    apply(colors: EditorChromeMap) {
      set(colors);
      applyEditorChromeToDocument(colors);
    },

    persist(colors: EditorChromeMap) {
      saveEditorChrome(colors);
      set(colors);
      applyEditorChromeToDocument(colors);
    },

    resetToDefaults() {
      const colors = defaultEditorChrome();
      saveEditorChrome(colors);
      set(colors);
      applyEditorChromeToDocument(colors);
      return colors;
    },

    /** After workbench theme changes: drop inline overrides and read colors from theme CSS. */
    syncFromActiveTheme(): EditorChromeMap {
      clearEditorChromeInlineOverrides();
      const colors = readEditorChromeFromDocument();
      set(colors);
      return colors;
    },
  };
}

export const editorChrome = createEditorChromeStore();
