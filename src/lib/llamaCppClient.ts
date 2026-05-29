/** Default llama-server listen address (override in Settings). */
export const DEFAULT_LLAMACPP_ENDPOINT = "http://127.0.0.1:8080";

export type LlamacppModelRow = {
  id: string;
  name: string;
  provider: "llamacpp";
  contextWindow: number;
};

/** Values reported by a running llama-server (`GET /props`). */
export type LlamacppLiveServerInfo = {
  nCtx: number | null;
  model: string | null;
  totalSlots: number | null;
  /** Subset of `default_generation_settings` for display in Settings. */
  generationDefaults: Record<string, unknown> | null;
};

function llamacppHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const k = apiKey?.trim();
  if (k) headers.Authorization = `Bearer ${k}`;
  return headers;
}

function llamacppBase(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

/** Parse `GET /props` JSON from llama-server. */
export function parseLlamacppPropsJson(json: unknown): LlamacppLiveServerInfo {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const gen = root.default_generation_settings;
  const genObj = gen && typeof gen === "object" ? (gen as Record<string, unknown>) : null;

  const nCtxRaw = genObj?.n_ctx ?? root.n_ctx;
  const nCtx =
    typeof nCtxRaw === "number" && Number.isFinite(nCtxRaw) && nCtxRaw > 0
      ? Math.floor(nCtxRaw)
      : null;

  const modelRaw = genObj?.model ?? root.model;
  const model = typeof modelRaw === "string" && modelRaw.trim() ? modelRaw.trim() : null;

  const slotsRaw = root.total_slots;
  const totalSlots =
    typeof slotsRaw === "number" && Number.isFinite(slotsRaw) ? Math.floor(slotsRaw) : null;

  return { nCtx, model, totalSlots, generationDefaults: genObj };
}

/**
 * Reads live server config from llama-server `GET /props` (context size, model id, slots).
 * Returns empty fields when the endpoint is missing or unreachable.
 */
export async function fetchLlamacppServerProps(
  endpoint: string,
  apiKey?: string
): Promise<LlamacppLiveServerInfo> {
  const empty: LlamacppLiveServerInfo = {
    nCtx: null,
    model: null,
    totalSlots: null,
    generationDefaults: null,
  };
  try {
    const res = await fetch(`${llamacppBase(endpoint)}/props`, {
      headers: llamacppHeaders(apiKey),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return empty;
    return parseLlamacppPropsJson(await res.json());
  } catch {
    return empty;
  }
}

/**
 * Lists models from llama.cpp server's OpenAI-compatible `GET /v1/models` (when enabled).
 * Context size comes from `GET /props` when available, else `fallbackContext`.
 */
export async function fetchLlamacppModelList(
  endpoint: string,
  apiKey?: string,
  fallbackContext = 8192,
  serverProps?: LlamacppLiveServerInfo | null
): Promise<LlamacppModelRow[]> {
  const base = llamacppBase(endpoint);
  const headers = llamacppHeaders(apiKey);
  const res = await fetch(`${base}/v1/models`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`llama.cpp server returned ${res.status}`);
  }
  const j = (await res.json()) as { data?: Array<{ id: string }> };
  const props = serverProps ?? (await fetchLlamacppServerProps(endpoint, apiKey));
  const contextWindow = props.nCtx ?? fallbackContext;
  return (j.data ?? []).map((m) => ({
    id: m.id,
    name: m.id,
    provider: "llamacpp" as const,
    contextWindow,
  }));
}
