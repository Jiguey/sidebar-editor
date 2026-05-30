import type { ModelConfig } from "./stores/settings";

/** Models shown in the chat footer model menu (default: all unless explicitly hidden). */
export function modelsVisibleInPicker(models: ModelConfig[]): ModelConfig[] {
  return models.filter((m) => m.showInPicker !== false);
}

/** Merge a fresh API catalog with prior picker toggles and context choices. */
export function mergeCloudModelCatalog(
  previous: ModelConfig[],
  fetched: ModelConfig[]
): ModelConfig[] {
  const prevById = new Map(previous.map((m) => [m.id, m]));
  return fetched.map((m) => {
    const prev = prevById.get(m.id);
    return {
      ...m,
      showInPicker: prev?.showInPicker ?? true,
      contextWindow: prev?.contextWindow ?? m.contextWindow,
      contextLimitMax: m.contextLimitMax ?? prev?.contextLimitMax,
    };
  });
}

export function mergeOllamaModelPicker(
  previous: ModelConfig[],
  fetched: ModelConfig[]
): ModelConfig[] {
  const prevById = new Map(previous.map((m) => [m.id, m]));
  return fetched.map((m) => {
    const prev = prevById.get(m.id);
    return {
      ...m,
      showInPicker: prev?.showInPicker ?? true,
    };
  });
}

export function findCloudModel(
  models: ModelConfig[],
  selectedModel: string,
  provider: ModelConfig["provider"]
): ModelConfig | undefined {
  return models.find((m) => m.id === selectedModel && m.provider === provider);
}

/** Split a list into fixed-width rows for a compact settings grid (e.g. 3 models per table row). */
export function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  if (columns < 1) return [items];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}
