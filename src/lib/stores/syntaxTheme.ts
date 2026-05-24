import { writable, get } from "svelte/store";
import {
  applySyntaxColorsToDocument,
  defaultSyntaxColors,
  loadSyntaxColors,
  saveSyntaxColors,
  TOKYO_NIGHT_SYNTAX_DEFAULTS,
  type SyntaxColorMap,
} from "../editor/syntaxColors";

function createSyntaxThemeStore() {
  const { subscribe, set, update } = writable<SyntaxColorMap>(loadSyntaxColors());

  return {
    subscribe,
    get: () => get({ subscribe }),

    init() {
      const colors = loadSyntaxColors();
      set(colors);
      applySyntaxColorsToDocument(colors);
    },

    apply(colors: SyntaxColorMap) {
      set(colors);
      applySyntaxColorsToDocument(colors);
    },

    persist(colors: SyntaxColorMap) {
      saveSyntaxColors(colors);
      set(colors);
      applySyntaxColorsToDocument(colors);
    },

    resetToDefaults() {
      const colors = defaultSyntaxColors();
      saveSyntaxColors(colors);
      set(colors);
      applySyntaxColorsToDocument(colors);
      return colors;
    },

    defaults: TOKYO_NIGHT_SYNTAX_DEFAULTS,
  };
}

export const syntaxTheme = createSyntaxThemeStore();
