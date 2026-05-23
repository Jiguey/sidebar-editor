import { writable, get } from "svelte/store";
import { readSystemPrompt, writeSystemPrompt, isTauriAvailable } from "../ipc";

function createSystemPromptStore() {
  const { subscribe, set, update } = writable<string>("");

  let lastWorkspacePath: string | null = null;

  return {
    subscribe,

    async load(workspacePath: string): Promise<void> {
      if (!isTauriAvailable()) {
        set("");
        return;
      }

      try {
        const content = await readSystemPrompt(workspacePath);
        set(content ?? "");
        lastWorkspacePath = workspacePath;
      } catch (e) {
        console.warn("Failed to load system prompt:", e);
        set("");
      }
    },

    async save(workspacePath: string, content: string): Promise<void> {
      if (!isTauriAvailable()) {
        throw new Error("Tauri not available");
      }

      await writeSystemPrompt(workspacePath, content);
      set(content);
      lastWorkspacePath = workspacePath;
    },

    async reload(): Promise<void> {
      if (lastWorkspacePath) {
        const content = await readSystemPrompt(lastWorkspacePath);
        set(content ?? "");
      }
    },

    clear(): void {
      set("");
      lastWorkspacePath = null;
    },

    get(): string {
      return get({ subscribe });
    },
  };
}

export const systemPrompt = createSystemPromptStore();
