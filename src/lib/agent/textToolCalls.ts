import type { StoredToolCall } from "../stores/chat";

const JSON_FENCE = /```(?:json)?\s*([\s\S]*?)```/gi;

const TOOL_NAME_ALIASES: Record<string, string> = {
  "git status": "get_git_status",
  "git diff": "get_git_diff",
  "git log": "get_git_log",
};

export function normalizeToolName(raw: string): string {
  const trimmed = raw.trim();
  const alias = TOOL_NAME_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

function tryParseObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isHallucinatedToolRecord(obj: Record<string, unknown>): boolean {
  if ("result" in obj || "output" in obj || "response" in obj) return true;
  const name = typeof obj.name === "string" ? obj.name.toLowerCase() : "";
  if (name.includes("porto")) return true;
  return false;
}

function toStoredToolCall(obj: Record<string, unknown>, allowedTools: Set<string>): StoredToolCall | null {
  if (isHallucinatedToolRecord(obj)) return null;
  const rawName = typeof obj.name === "string" ? obj.name : "";
  if (!rawName.trim()) return null;
  const name = normalizeToolName(rawName);
  if (!allowedTools.has(name)) return null;

  const args =
    obj.arguments && typeof obj.arguments === "object" && !Array.isArray(obj.arguments)
      ? (obj.arguments as Record<string, unknown>)
      : obj.args && typeof obj.args === "object" && !Array.isArray(obj.args)
        ? (obj.args as Record<string, unknown>)
        : {};

  return {
    id: `recovered-${crypto.randomUUID()}`,
    name,
    arguments: JSON.stringify(args),
  };
}

/** Pull tool invocations out of markdown/JSON the model wrote instead of using API tool_calls. */
export function recoverToolCallsFromText(
  content: string,
  allowedTools: Set<string>
): { calls: StoredToolCall[]; cleanedText: string } {
  const calls: StoredToolCall[] = [];
  const seen = new Set<string>();
  let cleaned = content;

  const tryAdd = (obj: Record<string, unknown>, rawSlice: string) => {
    const tc = toStoredToolCall(obj, allowedTools);
    if (!tc) return;
    const key = `${tc.name}:${tc.arguments}`;
    if (seen.has(key)) return;
    seen.add(key);
    calls.push(tc);
    cleaned = cleaned.replace(rawSlice, "");
  };

  for (const match of content.matchAll(JSON_FENCE)) {
    const raw = match[0];
    const inner = match[1]?.trim();
    if (!inner) continue;
    const obj = tryParseObject(inner);
    if (obj) tryAdd(obj, raw);
  }

  // Bare JSON objects on their own line
  for (const match of content.matchAll(/^\s*(\{[\s\S]*?\})\s*$/gm)) {
    const raw = match[0];
    const obj = tryParseObject(match[1]);
    if (obj) tryAdd(obj, raw);
  }

  cleaned = cleaned
    .replace(/```(?:json)?\s*```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { calls, cleanedText: cleaned };
}

/** Model wrote tool-like JSON or fake results in prose — nothing actually ran. */
export function textLooksLikeFakeToolUse(content: string): boolean {
  if (!content.trim()) return false;
  if (JSON_FENCE.test(content)) {
    JSON_FENCE.lastIndex = 0;
    return true;
  }
  if (/\{"name"\s*:\s*"[^"]+"/.test(content)) return true;
  if (/porto_file/i.test(content)) return true;
  if (/"result"\s*:\s*\{/.test(content)) return true;
  return false;
}

export const TOOL_USE_INSTRUCTION = `

Tool use (critical):
- Invoke tools through the API tool_call mechanism only — never write JSON tool calls in your reply text.
- Never invent or simulate tool results (no fake "result" / "output" blocks, no porto_file, no pretend git output).
- If you need to create a file, call write_file or create_file — do not only describe git add/commit unless the file already exists.
- Wait for real tool results before claiming work is done.`;
