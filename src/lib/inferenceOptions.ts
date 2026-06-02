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

export function inferenceOptionsForModel(
  st: InferenceSettingsSlice,
  backend: ChatBackend,
  modelId: string
): InferenceOptions | undefined {
  if (backend === "ollama") {
    const row = st.ollamaModels.find((m) => m.id === modelId);
    return {
      ...(row?.contextWindow ? { num_ctx: row.contextWindow } : {}),
      num_thread: st.ollamaServerTemplate.numThreads,
      think: true,
    };
  }
  if (backend === "llamacpp") {
    // llama-server sets context at startup — num_ctx is not a per-request parameter.
    // think/options are Ollama extensions that llama-server rejects.
    return undefined;
  }
  return undefined;
}

export function inferenceOptionsForSettings(st: InferenceSettingsSlice): InferenceOptions | undefined {
  return inferenceOptionsForModel(st, st.chatBackend, st.selectedModel);
}
