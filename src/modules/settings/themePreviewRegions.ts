export type ThemePreviewRegion =
  | "workbench-chrome"
  | "editor"
  | "syntax"
  | "explorer"
  | "chat";

export const THEME_REGION_LABELS: Record<ThemePreviewRegion, string> = {
  "workbench-chrome": "Workbench chrome",
  editor: "Editor",
  syntax: "Syntax",
  explorer: "Explorer",
  chat: "Chat",
};
