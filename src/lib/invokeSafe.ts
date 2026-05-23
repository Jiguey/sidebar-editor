import type { AppError, AppErrorCode } from "./errors";

export type InvokeResult<T> = { ok: true; data: T } | { ok: false; error: AppError };

function classifyMessage(msg: string): AppErrorCode {
  const m = msg.toLowerCase();
  if (m.includes("git") || m.includes("repository")) return "GIT";
  if (m.includes("sidecar") || m.includes("harness")) return "HARNESS";
  if (m.includes("path") || m.includes("file") || m.includes("directory")) return "FS";
  return "INVOKE_FAILED";
}

/** Normalizes Tauri `invoke` failures into {@link AppError} without throwing. */
export async function invokeSafe<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<InvokeResult<T>> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const data = await invoke<T>(cmd, args ?? {});
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { code: classifyMessage(message), message } };
  }
}
