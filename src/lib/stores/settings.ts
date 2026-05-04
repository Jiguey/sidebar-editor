import { writable } from "svelte/store";
import { RECOMMENDED_OLLAMA_MODELS } from "../ollamaClient";
import { DEFAULT_LLAMACPP_ENDPOINT } from "../llamaCppClient";

export type ChatBackend = "anthropic" | "ollama" | "llamacpp";

export interface ModelConfig {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "ollama" | "llamacpp";
  contextWindow: number;
  /** Ollama: max context from `api/show` (model on disk). */
  contextLimitMax?: number;
}

/** Chat agent implementations (sidecar `harnessFactory`). */
export const HARNESS_OPTIONS = [
  {
    id: "pi-latest",
    label: "Pi (bundled SDK — default)",
    hint: "Uses the Pi npm package shipped with the sidecar for versioning; chat still flows through this app’s model router.",
  },
  {
    id: "pi-minimal",
    label: "Pi-style (read-only tools)",
    hint: "Same routing as Pi default, but only read_file and list_dir are exposed to the model.",
  },
] as const;

export type HarnessKindId = (typeof HARNESS_OPTIONS)[number]["id"];

export const AVAILABLE_MODELS: ModelConfig[] = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic", contextWindow: 200000 },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", contextWindow: 200000 },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", contextWindow: 200000 },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", contextWindow: 128000 },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", contextWindow: 128000 },
];

function createSettingsStore() {
  const { subscribe, set, update } = writable<{
    apiKeys: {
      anthropic: string;
      openai: string;
    };
    /** Which stack answers chat (Anthropic API vs local Ollama). OpenAI key is reserved for a future provider. */
    chatBackend: ChatBackend;
    /** Sidecar harness preset (see HARNESS_OPTIONS). */
    harnessKind: HarnessKindId;
    /** Filled when the sidecar reports @mariozechner/pi-coding-agent VERSION after start. */
    lastBundledPiSdkVersion: string;
    ollamaEndpoint: string;
    llamacppEndpoint: string;
    llamacppApiKey: string;
    selectedModel: string;
    ollamaModels: ModelConfig[];
    llamacppModels: ModelConfig[];
    /**
     * When true, Claude 4+ requests use adaptive extended thinking; thinking streams in a side panel in chat.
     * Disabled automatically for model IDs that do not support it (handled in the sidecar).
     */
    anthropicExtendedThinking: boolean;
  }>({
    apiKeys: {
      anthropic: "",
      openai: "",
    },
    chatBackend: "anthropic",
    harnessKind: "pi-latest",
    lastBundledPiSdkVersion: "",
    ollamaEndpoint: "http://127.0.0.1:11434",
    llamacppEndpoint: DEFAULT_LLAMACPP_ENDPOINT,
    llamacppApiKey: "",
    selectedModel: "claude-sonnet-4-20250514",
    ollamaModels: [],
    llamacppModels: [],
    anthropicExtendedThinking: true,
  });

  return {
    subscribe,
    setApiKey: (provider: "anthropic" | "openai", key: string) => {
      update((state) => ({
        ...state,
        apiKeys: { ...state.apiKeys, [provider]: key },
      }));
    },
    setOllamaEndpoint: (endpoint: string) => {
      update((state) => ({ ...state, ollamaEndpoint: endpoint }));
    },
    setLlamacppEndpoint: (endpoint: string) => {
      update((state) => ({ ...state, llamacppEndpoint: endpoint }));
    },
    setLlamacppApiKey: (key: string) => {
      update((state) => ({ ...state, llamacppApiKey: key }));
    },
    setSelectedModel: (modelId: string) => {
      update((state) => ({ ...state, selectedModel: modelId }));
    },
    setHarnessKind: (harnessKind: HarnessKindId) => {
      update((state) => ({ ...state, harnessKind }));
    },
    setLastBundledPiSdkVersion: (v: string) => {
      update((state) => ({ ...state, lastBundledPiSdkVersion: v }));
    },
    setChatBackend: (chatBackend: ChatBackend) => {
      update((state) => {
        if (chatBackend === "anthropic") {
          const cloud = AVAILABLE_MODELS.filter((m) => m.provider === "anthropic");
          const selected = cloud.some((m) => m.id === state.selectedModel)
            ? state.selectedModel
            : (cloud[0]?.id ?? state.selectedModel);
          return { ...state, chatBackend, selectedModel: selected };
        }
        if (chatBackend === "ollama") {
          const ollama = state.ollamaModels;
          const rec = RECOMMENDED_OLLAMA_MODELS;
          const allowed = new Set([...ollama.map((m) => m.id), ...rec.map((r) => r.id)]);
          const selected = allowed.has(state.selectedModel)
            ? state.selectedModel
            : (ollama[0]?.id ?? rec[0]?.id ?? state.selectedModel);
          return { ...state, chatBackend, selectedModel: selected };
        }
        const lp = state.llamacppModels;
        const selected = lp.some((m) => m.id === state.selectedModel)
          ? state.selectedModel
          : (lp[0]?.id ?? (state.selectedModel.trim() || "local-model"));
        return { ...state, chatBackend, selectedModel: selected };
      });
    },
    setOllamaModels: (models: ModelConfig[]) => {
      update((state) => ({ ...state, ollamaModels: models }));
    },
    setLlamacppModels: (models: ModelConfig[]) => {
      update((state) => ({ ...state, llamacppModels: models }));
    },
    setAnthropicExtendedThinking: (anthropicExtendedThinking: boolean) => {
      update((state) => ({ ...state, anthropicExtendedThinking }));
    },
  };
}

export const settings = createSettingsStore();
