export type ExplorerPanelTab = "files" | "git" | "prompt";

export const EXPLORER_PANEL_TABS: { id: ExplorerPanelTab; title: string }[] = [
  { id: "files", title: "Explorer" },
  { id: "git", title: "Git" },
  { id: "prompt", title: "System Prompt" },
];
