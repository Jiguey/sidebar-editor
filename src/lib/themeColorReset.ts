/** Read one CSS variable from the active workbench theme (clears inline override first). */
export function readThemeCssVar(cssVar: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const root = document.documentElement;
  root.style.removeProperty(cssVar);
  const value = getComputedStyle(root).getPropertyValue(cssVar).trim();
  return value || fallback;
}
