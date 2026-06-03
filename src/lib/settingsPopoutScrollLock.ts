import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { setWorkbenchAuxiliaryScrollLock } from "./workbenchScrollLock";

const SETTINGS_LABEL = "settings";

/** Keep main-window scrollbars suppressed while the settings popout exists. */
export async function bindSettingsPopoutScrollLock(): Promise<void> {
  const win = await WebviewWindow.getByLabel(SETTINGS_LABEL);
  if (!win) {
    setWorkbenchAuxiliaryScrollLock(false);
    return;
  }

  setWorkbenchAuxiliaryScrollLock(true);
  void win.once("tauri://destroyed", () => {
    setWorkbenchAuxiliaryScrollLock(false);
  });
}

export async function syncAuxiliaryScrollLockWithSettingsWindow(): Promise<void> {
  const win = await WebviewWindow.getByLabel(SETTINGS_LABEL);
  if (win) {
    await bindSettingsPopoutScrollLock();
  } else {
    setWorkbenchAuxiliaryScrollLock(false);
  }
}
