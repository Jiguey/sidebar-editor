import type { Tool } from "./providers/openaiCompat";
import { TOOL_DEFINITIONS } from "./tools/toolDefinitions";

export const EMPTY_PARAMETERS_JSON = JSON.stringify(
  { type: "object", properties: {}, required: [] },
  null,
  2
);

export function parametersToJson(
  parameters: Tool["function"]["parameters"] | undefined
): string {
  if (!parameters) return EMPTY_PARAMETERS_JSON;
  return JSON.stringify(parameters, null, 2);
}

export function parseParametersJson(json: string): {
  ok: true;
  value: Tool["function"]["parameters"];
} | { ok: false; error: string } {
  const trimmed = json.trim();
  if (!trimmed) {
    return {
      ok: true,
      value: { type: "object", properties: {}, required: [] },
    };
  }
  try {
    const parsed = JSON.parse(trimmed) as Tool["function"]["parameters"];
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "Parameters must be a JSON object." };
    }
    if (parsed.type !== "object") {
      return { ok: false, error: 'Parameters must have "type": "object".' };
    }
    if (!parsed.properties || typeof parsed.properties !== "object") {
      return { ok: false, error: 'Parameters must include a "properties" object.' };
    }
    return { ok: true, value: parsed };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function buildToolDefinition(
  name: string,
  description: string,
  parametersJson: string
): { ok: true; tool: Tool } | { ok: false; error: string } {
  const params = parseParametersJson(parametersJson);
  if (!params.ok) return params;
  return {
    ok: true,
    tool: {
      type: "function",
      function: {
        name,
        description,
        parameters: params.value,
      },
    },
  };
}

export function getBuiltinToolTemplate(name: string): Tool | null {
  return TOOL_DEFINITIONS[name] ?? null;
}

export function defaultBuiltinEditorJson(name: string): string {
  const t = getBuiltinToolTemplate(name);
  return parametersToJson(t?.function.parameters);
}
