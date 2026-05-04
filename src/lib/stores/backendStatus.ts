import { writable } from "svelte/store";
import type { ChatBackend } from "./settings";

export type StatusDot = "green" | "red" | "yellow" | "idle";

export interface BackendStatusLine {
  backend: ChatBackend;
  dot: StatusDot;
  label: string;
  detail: string;
}

function createBackendStatusStore() {
  const initial: BackendStatusLine = {
    backend: "anthropic",
    dot: "idle",
    label: "—",
    detail: "",
  };
  const { subscribe, set } = writable<BackendStatusLine>(initial);

  return {
    subscribe,
    set,
  };
}

export const backendStatus = createBackendStatusStore();

/** Normalize Ollama tag names (strip optional :latest). */
function ollamaTagMatches(tags: string[], selected: string): boolean {
  const want = selected.trim();
  if (!want) return false;
  return tags.some((t) => t === want || t === `${want}:latest` || want === `${t}:latest`);
}

/**
 * Poll reachability for the active chat backend. Green = ready, yellow = host up but model missing,
 * red = unreachable / misconfigured.
 */
export async function pollBackendHealth(input: {
  chatBackend: ChatBackend;
  selectedModel: string;
  ollamaEndpoint: string;
  llamacppEndpoint: string;
  anthropicApiKey: string;
}): Promise<BackendStatusLine> {
  const { chatBackend, selectedModel, ollamaEndpoint, llamacppEndpoint, anthropicApiKey } = input;
  const timeout = AbortSignal.timeout(8_000);

  if (chatBackend === "ollama") {
    const base = ollamaEndpoint.replace(/\/$/, "");
    try {
      const ver = await fetch(`${base}/api/version`, { signal: timeout });
      if (!ver.ok) {
        return {
          backend: "ollama",
          dot: "red",
          label: "Ollama",
          detail: `HTTP ${ver.status} at ${base}`,
        };
      }
      const tagsRes = await fetch(`${base}/api/tags`, { signal: timeout });
      if (!tagsRes.ok) {
        return {
          backend: "ollama",
          dot: "yellow",
          label: "Ollama",
          detail: `Running but tags failed (${tagsRes.status})`,
        };
      }
      const tagsJson = (await tagsRes.json()) as { models?: { name: string }[] };
      const names = (tagsJson.models ?? []).map((m) => m.name);
      if (ollamaTagMatches(names, selectedModel)) {
        return { backend: "ollama", dot: "green", label: "Ollama", detail: `${selectedModel} · ${base}` };
      }
      return {
        backend: "ollama",
        dot: "yellow",
        label: "Ollama",
        detail: `Model not installed: ${selectedModel} (pull or pick another)`,
      };
    } catch {
      return {
        backend: "ollama",
        dot: "red",
        label: "Ollama",
        detail: `Unreachable at ${base}`,
      };
    }
  }

  if (chatBackend === "llamacpp") {
    const base = llamacppEndpoint.replace(/\/$/, "");
    try {
      const res = await fetch(`${base}/v1/models`, { signal: timeout });
      if (!res.ok) {
        return {
          backend: "llamacpp",
          dot: "red",
          label: "llama.cpp",
          detail: `HTTP ${res.status} at ${base}`,
        };
      }
      const j = (await res.json()) as { data?: { id: string }[] };
      const ids = (j.data ?? []).map((m) => m.id);
      const okModel = ids.includes(selectedModel) || ids.some((id) => id.endsWith(selectedModel));
      if (okModel) {
        return {
          backend: "llamacpp",
          dot: "green",
          label: "llama.cpp",
          detail: `${selectedModel} · ${base}`,
        };
      }
      return {
        backend: "llamacpp",
        dot: "yellow",
        label: "llama.cpp",
        detail: ids.length ? `Server up; model "${selectedModel}" not in /v1/models` : `No models at ${base}`,
      };
    } catch {
      return {
        backend: "llamacpp",
        dot: "red",
        label: "llama.cpp",
        detail: `Unreachable at ${base}`,
      };
    }
  }

  const key = anthropicApiKey.trim();
  if (key.length >= 20) {
    return {
      backend: "anthropic",
      dot: "green",
      label: "Anthropic",
      detail: `API key set · ${selectedModel}`,
    };
  }
  return {
    backend: "anthropic",
    dot: "red",
    label: "Anthropic",
    detail: "Add an API key in Settings",
  };
}
