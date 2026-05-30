/** Fixed width for chat + workbench header tabs when uniform mode is on. */
export const TAB_UNIFORM_WIDTH_MIN = 64;
export const TAB_UNIFORM_WIDTH_MAX = 220;
/** Default when enabled (was 108px in CSS; slightly narrower). */
export const DEFAULT_TAB_UNIFORM_WIDTH_PX = 96;

export function normalizeUniformTabWidthPx(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return DEFAULT_TAB_UNIFORM_WIDTH_PX;
  }
  return Math.round(Math.min(TAB_UNIFORM_WIDTH_MAX, Math.max(TAB_UNIFORM_WIDTH_MIN, raw)));
}
