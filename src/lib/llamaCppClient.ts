/** Default llama-server listen address (override in Settings). */
export const DEFAULT_LLAMACPP_ENDPOINT = "http://127.0.0.1:8080";

export type LlamacppModelRow = {
  id: string;
  name: string;
  provider: "llamacpp";
  contextWindow: number;
};

/**
 * Lists models from llama.cpp server's OpenAI-compatible `GET /v1/models` (when enabled).
 */
export async function fetchLlamacppModelList(
  endpoint: string,
  apiKey?: string
): Promise<LlamacppModelRow[]> {
  const base = endpoint.replace(/\/$/, "");
  const headers: Record<string, string> = {};
  const k = apiKey?.trim();
  if (k) headers.Authorization = `Bearer ${k}`;
  const res = await fetch(`${base}/v1/models`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`llama.cpp server returned ${res.status}`);
  }
  const j = (await res.json()) as { data?: Array<{ id: string }> };
  return (j.data ?? []).map((m) => ({
    id: m.id,
    name: m.id,
    provider: "llamacpp" as const,
    contextWindow: 8192,
  }));
}
