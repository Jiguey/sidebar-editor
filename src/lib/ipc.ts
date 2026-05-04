import type { FileEntry } from "./stores/files";

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

let invoke: typeof import("@tauri-apps/api/core").invoke;
let listen: typeof import("@tauri-apps/api/event").listen;

let apiLoad: Promise<void> | null = null;

function ensureTauriApi(): Promise<void> {
  if (!isTauri) {
    return Promise.reject(
      new Error("Tauri API unavailable. Run with 'npm run tauri dev' instead of 'npm run dev'.")
    );
  }
  if (!apiLoad) {
    apiLoad = Promise.all([
      import("@tauri-apps/api/core"),
      import("@tauri-apps/api/event"),
    ]).then(([core, eventMod]) => {
      invoke = core.invoke;
      listen = eventMod.listen;
    });
  }
  return apiLoad;
}

export async function listDir(path: string): Promise<FileEntry[]> {
  await ensureTauriApi();
  return invoke<FileEntry[]>("list_dir", { path });
}

export async function readFile(path: string): Promise<string> {
  await ensureTauriApi();
  return invoke<string>("read_file", { path });
}

export async function writeFile(path: string, contents: string): Promise<void> {
  await ensureTauriApi();
  return invoke<void>("write_file", { path, contents });
}

export async function getWorkspacePath(): Promise<string> {
  await ensureTauriApi();
  return invoke<string>("get_workspace_path");
}

export async function startHarness(): Promise<void> {
  await ensureTauriApi();
  return invoke<void>("start_harness");
}

export async function sendToHarness(
  method: string,
  params: Record<string, unknown>
): Promise<number> {
  await ensureTauriApi();
  return invoke<number>("send_to_harness", { method, params });
}

export async function stopHarness(): Promise<void> {
  await ensureTauriApi();
  return invoke<void>("stop_harness");
}

export interface HarnessEvent {
  id: number;
  event: string;
  data: unknown;
}

type UnlistenFn = () => void;

export async function listenHarnessEvents(
  callback: (event: HarnessEvent) => void
): Promise<UnlistenFn> {
  await ensureTauriApi();
  return listen<HarnessEvent>("harness:event", (e) => {
    callback(e.payload);
  });
}

export function isTauriAvailable(): boolean {
  return isTauri;
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    rs: "rust",
    py: "python",
    html: "html",
    css: "css",
    scss: "css",
    svelte: "svelte",
    vue: "vue",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
  };
  return langMap[ext] ?? "plaintext";
}
