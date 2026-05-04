import { writable } from "svelte/store";
import type { ToolPolicyMode, ToolPolicyConfig } from "../toolPolicy";

function createToolPolicyStore() {
  const { subscribe, set, update } = writable<ToolPolicyConfig>({
    mode: "allow_all",
    whitelist: [],
  });

  return {
    subscribe,
    setMode: (mode: ToolPolicyMode) => update((s) => ({ ...s, mode })),
    setWhitelist: (whitelist: string[]) => update((s) => ({ ...s, whitelist })),
    reset: () =>
      set({
        mode: "allow_all",
        whitelist: [],
      }),
  };
}

export const toolPolicy = createToolPolicyStore();
