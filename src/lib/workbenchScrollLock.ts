/**
 * Suppress WebKitGTK overlay scrollbars bleeding over modals / sibling windows.
 * Hides the workbench from the paint tree while locked.
 */
const CLASS = "workbench-overlay-open";

let modalLock = false;
let auxiliaryLock = false;

function syncScrollLock(): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(CLASS, modalLock || auxiliaryLock);
}

/** Settings / feedback modal open in the main window. */
export function setWorkbenchModalScrollLock(locked: boolean): void {
  modalLock = locked;
  syncScrollLock();
}

/** Settings popout window open (main window stays visible but must not paint scrollbars). */
export function setWorkbenchAuxiliaryScrollLock(locked: boolean): void {
  auxiliaryLock = locked;
  syncScrollLock();
}

/** @deprecated Use setWorkbenchModalScrollLock / setWorkbenchAuxiliaryScrollLock */
export function setWorkbenchScrollLock(locked: boolean): void {
  modalLock = locked;
  auxiliaryLock = false;
  syncScrollLock();
}

export function isWorkbenchScrollLocked(): boolean {
  return modalLock || auxiliaryLock;
}
