/**
 * Ollama Library - Search and pull models from Ollama registry
 */

export interface OllamaLibraryModel {
  name: string;
  description: string;
  tags: string[];
  pulls: number;
  updated: string;
  size?: string;
}

export interface OllamaPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

const POPULAR_MODELS: OllamaLibraryModel[] = [
  {
    name: "llama3.2",
    description: "Meta's latest lightweight model, great for on-device use",
    tags: ["1b", "3b"],
    pulls: 1000000,
    updated: "2024-09",
    size: "1.3GB - 2GB",
  },
  {
    name: "llama3.1",
    description: "Meta's powerful open model with 8B-405B parameters",
    tags: ["8b", "70b", "405b"],
    pulls: 5000000,
    updated: "2024-07",
    size: "4.7GB - 231GB",
  },
  {
    name: "qwen2.5",
    description: "Alibaba's latest model, strong coding and reasoning",
    tags: ["0.5b", "1.5b", "3b", "7b", "14b", "32b", "72b"],
    pulls: 2000000,
    updated: "2024-09",
    size: "398MB - 47GB",
  },
  {
    name: "qwen2.5-coder",
    description: "Specialized for code generation and understanding",
    tags: ["0.5b", "1.5b", "3b", "7b", "14b", "32b"],
    pulls: 500000,
    updated: "2024-09",
    size: "531MB - 19GB",
  },
  {
    name: "mistral",
    description: "Mistral AI's 7B model, fast and efficient",
    tags: ["7b"],
    pulls: 3000000,
    updated: "2024-02",
    size: "4.1GB",
  },
  {
    name: "mixtral",
    description: "Mixture of Experts model from Mistral AI",
    tags: ["8x7b", "8x22b"],
    pulls: 1500000,
    updated: "2024-04",
    size: "26GB - 80GB",
  },
  {
    name: "codellama",
    description: "Meta's code-specialized Llama model",
    tags: ["7b", "13b", "34b", "70b"],
    pulls: 2500000,
    updated: "2024-01",
    size: "3.8GB - 39GB",
  },
  {
    name: "deepseek-coder-v2",
    description: "DeepSeek's code model with strong performance",
    tags: ["16b", "236b"],
    pulls: 800000,
    updated: "2024-06",
    size: "8.9GB - 133GB",
  },
  {
    name: "phi3",
    description: "Microsoft's small but capable model",
    tags: ["mini", "small", "medium"],
    pulls: 1200000,
    updated: "2024-04",
    size: "2.2GB - 7.9GB",
  },
  {
    name: "gemma2",
    description: "Google's open model with strong reasoning",
    tags: ["2b", "9b", "27b"],
    pulls: 900000,
    updated: "2024-06",
    size: "1.6GB - 16GB",
  },
  {
    name: "starcoder2",
    description: "BigCode's code generation model",
    tags: ["3b", "7b", "15b"],
    pulls: 400000,
    updated: "2024-02",
    size: "1.7GB - 9GB",
  },
  {
    name: "nomic-embed-text",
    description: "Text embedding model for semantic search",
    tags: ["v1.5"],
    pulls: 600000,
    updated: "2024-02",
    size: "274MB",
  },
];

export function searchModels(query: string): OllamaLibraryModel[] {
  if (!query.trim()) {
    return POPULAR_MODELS;
  }

  const lower = query.toLowerCase();
  return POPULAR_MODELS.filter(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      m.description.toLowerCase().includes(lower) ||
      m.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

export function getPopularModels(): OllamaLibraryModel[] {
  return POPULAR_MODELS;
}

export function formatModelWithTag(name: string, tag: string): string {
  return `${name}:${tag}`;
}

export async function pullModel(
  endpoint: string,
  modelName: string,
  onProgress?: (progress: OllamaPullProgress) => void
): Promise<{ success: boolean; error?: string }> {
  const url = `${endpoint.replace(/\/$/, "")}/api/pull`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      return { success: false, error: `Failed to pull model: ${text}` };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: "No response body" };
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const progress = JSON.parse(line) as OllamaPullProgress;
          onProgress?.(progress);

          if (progress.status === "success") {
            reader.releaseLock();
            return { success: true };
          }
        } catch {
          continue;
        }
      }
    }

    reader.releaseLock();
    return { success: true };
  } catch (e) {
    const error = e as Error;
    return { success: false, error: `Network error: ${error.message}` };
  }
}

export async function deleteModel(
  endpoint: string,
  modelName: string
): Promise<{ success: boolean; error?: string }> {
  const url = `${endpoint.replace(/\/$/, "")}/api/delete`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      return { success: false, error: `Failed to delete model: ${text}` };
    }

    return { success: true };
  } catch (e) {
    const error = e as Error;
    return { success: false, error: `Network error: ${error.message}` };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatPullProgress(progress: OllamaPullProgress): string {
  if (progress.total && progress.completed) {
    const percent = Math.round((progress.completed / progress.total) * 100);
    return `${progress.status} - ${percent}% (${formatBytes(progress.completed)} / ${formatBytes(progress.total)})`;
  }
  return progress.status;
}
