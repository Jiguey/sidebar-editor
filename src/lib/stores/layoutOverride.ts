import { writable } from "svelte/store";

/**
 * One-shot layout override consumed on WorkbenchShell mount.
 * Set before the shell renders (e.g. from CLI file-open) to collapse panels.
 */
export interface LayoutOverride {
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showBottomPanel: boolean;
  showTabStrip: boolean;
}

export const layoutOverride = writable<LayoutOverride | null>(null);
