import type { ChatBackend } from "./stores/settings";
import type { ModelConfig } from "./stores/settings";
import type { InferenceOptions } from "./providers/openaiCompat";

type InferenceSettingsSlice = {
  chatBackend: ChatBackend;
  selectedModel: string;
  ollamaModels: ModelConfig[];
  llamacppModels: ModelConfig[];
  ollamaServerTemplate: { numThreads: number };
};

export function inferenceOptionsForSettings(st: InferenceSettingsSlice): InferenceOptions | undefined {
  if (st.chatBackend === "ollama") {
    const row = st.ollamaModels.find((m) => m.id === st.selectedModel);
    return {
      ...(row?.contextWindow ? { num_ctx: row.contextWindow } : {}),
      num_thread: st.ollamaServerTemplate.numThreads,
      think: true,
    };
  }
  if (st.chatBackend === "llamacpp") {
    const row = st.llamacppModels.find((m) => m.id === st.selectedModel);
    if (!row?.contextWindow) return undefined;
    return { num_ctx: row.contextWindow, think: true };
  }
  return undefined;
}
