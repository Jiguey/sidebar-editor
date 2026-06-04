import { writable, get } from "svelte/store";
import {
  applyWorkbenchChromeToDocument,
  clearWorkbenchChromeInlineOverrides,
  defaultWorkbenchChrome,
  loadWorkbenchChrome,
  readWorkbenchChromeFromDocument,
  saveWorkbenchChrome,
  type WorkbenchChromeMap,
} from "../workbench/workbenchChrome";

function createWorkbenchChromeStore() {
  const { subscribe, set } = writable<WorkbenchChromeMap>(loadWorkbenchChrome());

  return {
    subscribe,
    get: () => get({ subscribe }),

    init() {
      const colors = loadWorkbenchChrome();
      set(colors);
      applyWorkbenchChromeToDocument(colors);
    },

    apply(colors: WorkbenchChromeMap) {
      set(colors);
      applyWorkbenchChromeToDocument(colors);
    },

    persist(colors: WorkbenchChromeMap) {
      saveWorkbenchChrome(colors);
      set(colors);
      applyWorkbenchChromeToDocument(colors);
    },

    resetToDefaults() {
      const colors = defaultWorkbenchChrome();
      saveWorkbenchChrome(colors);
      set(colors);
      applyWorkbenchChromeToDocument(colors);
      return colors;
    },

    /** After workbench theme changes: drop inline overrides and read colors from theme CSS. */
    syncFromActiveTheme(): WorkbenchChromeMap {
      clearWorkbenchChromeInlineOverrides();
      const colors = readWorkbenchChromeFromDocument();
      set(colors);
      return colors;
    },
  };
}

export const workbenchChrome = createWorkbenchChromeStore();
