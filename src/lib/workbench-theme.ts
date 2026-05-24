/** Presets applied via `data-workbench-theme` on `<html>` (see `styles/workbench-themes.css`). */
export const WORKBENCH_THEME_OPTIONS = [
  { id: "catppuccin-mocha", label: "Catppuccin Mocha (default)" },
  { id: "vscode-dark", label: "VS Code Dark" },
  { id: "tokyo-night", label: "Tokyo Night" },
  { id: "one-dark-pro", label: "One Dark Pro" },
  { id: "tiny-llama", label: "Tiny Llama" },
  { id: "dracula", label: "Dracula" },
  { id: "github-dark", label: "GitHub Dark" },
] as const;

export type WorkbenchThemeId = (typeof WORKBENCH_THEME_OPTIONS)[number]["id"];

const KNOWN = new Set<string>(WORKBENCH_THEME_OPTIONS.map((t) => t.id));

export function normalizeWorkbenchTheme(id: unknown): WorkbenchThemeId {
  if (typeof id === "string" && KNOWN.has(id)) return id as WorkbenchThemeId;
  return "catppuccin-mocha";
}

/** `catppuccin-mocha` and `vscode-dark` use base tokens from `globals.css`. */
export function applyWorkbenchTheme(id: string | undefined | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const v = (id ?? "catppuccin-mocha").trim();
  if (!KNOWN.has(v) || v === "catppuccin-mocha") {
    root.removeAttribute("data-workbench-theme");
    return;
  }
  root.setAttribute("data-workbench-theme", v);
}
