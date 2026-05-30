/** Inline autocomplete settings (not wired yet). */

export type AutocompleteSettings = {
  enabled: boolean;
  /** Minimum delay (ms) before requesting a completion. */
  debounceMs: number;
};

export const DEFAULT_AUTOCOMPLETE: AutocompleteSettings = {
  enabled: false,
  debounceMs: 300,
};

export const AUTOCOMPLETE_BOUNDS = {
  debounceMs: { min: 100, max: 2000 },
} as const;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function normalizeAutocompleteSettings(
  raw: Partial<AutocompleteSettings> | undefined
): AutocompleteSettings {
  const base = raw ?? {};
  return {
    enabled: base.enabled === true,
    debounceMs: clampInt(
      base.debounceMs,
      AUTOCOMPLETE_BOUNDS.debounceMs.min,
      AUTOCOMPLETE_BOUNDS.debounceMs.max,
      DEFAULT_AUTOCOMPLETE.debounceMs
    ),
  };
}
