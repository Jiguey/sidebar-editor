/** Presets applied via `data-workbench-theme` on `<html>` (see `styles/workbench-themes.css`). */
export const WORKBENCH_THEME_OPTIONS = [
  { id: "vscode-dark", label: "VS Code Dark (default)" },
  { id: "cursor-dark", label: "Cursor Dark" },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { id: "tokyo-night", label: "Tokyo Night" },
  { id: "one-dark-pro", label: "One Dark Pro" },
  { id: "sidebar", label: "Sidebar" },
  { id: "dracula", label: "Dracula" },
  { id: "github-dark", label: "GitHub Dark" },
  { id: "rose-pine", label: "Rosé Pine" },
] as const;

export type WorkbenchThemeId = (typeof WORKBENCH_THEME_OPTIONS)[number]["id"];

const KNOWN = new Set<string>(WORKBENCH_THEME_OPTIONS.map((t) => t.id));

export function normalizeWorkbenchTheme(id: unknown): WorkbenchThemeId {
  if (typeof id === "string" && KNOWN.has(id)) return id as WorkbenchThemeId;
  return "vscode-dark";
}

/** `vscode-dark` uses base tokens from `globals.css` (classic VS Code / pre–Cursor Dark look). */
export function applyWorkbenchTheme(id: string | undefined | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const v = (id ?? "vscode-dark").trim();
  if (!KNOWN.has(v) || v === "vscode-dark") {
    root.removeAttribute("data-workbench-theme");
    return;
  }
  root.setAttribute("data-workbench-theme", v);
}
