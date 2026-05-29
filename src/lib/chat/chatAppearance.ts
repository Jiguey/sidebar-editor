/** Chat agent activity feed — waiting style and activity colors (persisted in localStorage). */

export type ChatWaitingStyle = "spinner-row" | "dots";

export const CHAT_APPEARANCE_DEFAULTS = {
  waitingStyle: "spinner-row" as ChatWaitingStyle,
  thoughtLabelColor: "#b8a8e8",
  thoughtLabelActiveColor: "#c9b8f0",
  planLabelColor: "#b8a8e8",
  toolRunningColor: "#9ec9b8",
  toolDoneColor: "#7dd3c0",
  toolFailedColor: "#f08080",
  toolBadgeDoneColor: "#4ec9b0",
  toolBadgeErrorColor: "#f14c4c",
  fileLinkColor: "#4ec9b0",
} as const;

export type ChatAppearanceKey = keyof typeof CHAT_APPEARANCE_DEFAULTS;

export type ChatAppearanceMap = {
  waitingStyle: ChatWaitingStyle;
  thoughtLabelColor: string;
  thoughtLabelActiveColor: string;
  planLabelColor: string;
  toolRunningColor: string;
  toolDoneColor: string;
  toolFailedColor: string;
  toolBadgeDoneColor: string;
  toolBadgeErrorColor: string;
  fileLinkColor: string;
};

export const CHAT_WAITING_STYLE_OPTIONS: { id: ChatWaitingStyle; label: string }[] = [
  { id: "spinner-row", label: "Purple row + spinner (default)" },
  { id: "dots", label: "Whimsical word + animated dots" },
];

export const CHAT_APPEARANCE_COLOR_FIELDS: {
  key: Exclude<ChatAppearanceKey, "waitingStyle">;
  label: string;
  hint: string;
}[] = [
  { key: "thoughtLabelColor", label: "Thought / status label", hint: "Whimsical label while thinking" },
  {
    key: "thoughtLabelActiveColor",
    label: "Thought label (active)",
    hint: "Label while spinner is showing",
  },
  { key: "planLabelColor", label: "Plan label", hint: "Pre-tool plan line" },
  { key: "toolRunningColor", label: "Tool (running)", hint: "In-progress tool calls" },
  { key: "toolDoneColor", label: "Tool (done)", hint: "Successful finished tools" },
  { key: "toolFailedColor", label: "Tool (failed)", hint: "Failed or errored tools" },
  { key: "toolBadgeDoneColor", label: "Badge: done", hint: "“done” tag on tools" },
  { key: "toolBadgeErrorColor", label: "Badge: failed", hint: "“failed” tag on tools" },
  { key: "fileLinkColor", label: "File chips", hint: "Paths opened from tool rows" },
];

const STORAGE_KEY = "tinyllama.chatAppearance.v1";

function normalizeHex(raw: string, fallback: string): string {
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const h = t.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return fallback;
}

function normalizeWaitingStyle(raw: unknown): ChatWaitingStyle {
  return raw === "dots" ? "dots" : "spinner-row";
}

export function defaultChatAppearance(): ChatAppearanceMap {
  return { ...CHAT_APPEARANCE_DEFAULTS };
}

export function normalizeChatAppearance(
  parsed: Partial<ChatAppearanceMap> | null | undefined
): ChatAppearanceMap {
  const base = defaultChatAppearance();
  if (!parsed || typeof parsed !== "object") return base;
  const out: ChatAppearanceMap = { ...base };
  out.waitingStyle = normalizeWaitingStyle(parsed.waitingStyle);
  for (const field of CHAT_APPEARANCE_COLOR_FIELDS) {
    const v = parsed[field.key];
    if (typeof v === "string") {
      out[field.key] = normalizeHex(v, base[field.key]);
    }
  }
  return out;
}

export function loadChatAppearance(): ChatAppearanceMap {
  if (typeof localStorage === "undefined") return defaultChatAppearance();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultChatAppearance();
    return normalizeChatAppearance(JSON.parse(raw) as Partial<ChatAppearanceMap>);
  } catch {
    return defaultChatAppearance();
  }
}

export function saveChatAppearance(appearance: ChatAppearanceMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    /* ignore */
  }
}

export function applyChatAppearanceToDocument(appearance: ChatAppearanceMap): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.chatWaitingStyle = appearance.waitingStyle;
  root.style.setProperty("--chat-thought-label", appearance.thoughtLabelColor);
  root.style.setProperty("--chat-thought-label-active", appearance.thoughtLabelActiveColor);
  root.style.setProperty("--chat-plan-label", appearance.planLabelColor);
  root.style.setProperty("--chat-activity-tool-running", appearance.toolRunningColor);
  root.style.setProperty("--chat-activity-tool-done", appearance.toolDoneColor);
  root.style.setProperty("--chat-activity-tool-failed", appearance.toolFailedColor);
  root.style.setProperty("--chat-activity-badge-done", appearance.toolBadgeDoneColor);
  root.style.setProperty("--chat-activity-badge-error", appearance.toolBadgeErrorColor);
  root.style.setProperty("--chat-activity-file-link", appearance.fileLinkColor);
}
