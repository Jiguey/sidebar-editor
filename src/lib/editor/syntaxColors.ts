/** Tokyo Night–style defaults for the code editor (Nightfox / Tokyo Night Storm–aligned). */
export const TOKYO_NIGHT_SYNTAX_DEFAULTS = {
  keyword: "#bb9af7",
  function: "#7aa2f7",
  variable: "#c0caf5",
  number: "#ff9e64",
  string: "#9ece6a",
  type: "#2ac3de",
  operator: "#f7768e",
  property: "#73daca",
  comment: "#565f89",
  /** Fallback when a token has no specific rule. */
  default: "#c0caf5",
  invalid: "#f7768e",
} as const;

export type SyntaxColorKey = keyof typeof TOKYO_NIGHT_SYNTAX_DEFAULTS;

export type SyntaxColorMap = Record<SyntaxColorKey, string>;

export const SYNTAX_COLOR_FIELDS: {
  key: SyntaxColorKey;
  label: string;
  hint: string;
}[] = [
  { key: "keyword", label: "Keywords", hint: "if · return · const · class" },
  { key: "function", label: "Functions", hint: "myFunction() · render()" },
  { key: "variable", label: "Variables", hint: "myVar · count · data" },
  { key: "number", label: "Constants / numbers", hint: "MAX_SIZE · 42 · 3.14" },
  { key: "string", label: "Strings", hint: '"hello world" · \'arch linux\'' },
  { key: "type", label: "Types / classes", hint: "String · MyClass · Vec" },
  { key: "operator", label: "Operators / special", hint: "= · && · => · !" },
  { key: "property", label: "Properties / fields", hint: "obj.name · self.value" },
  { key: "comment", label: "Comments", hint: "// this is a comment" },
];

const STORAGE_KEY = "tinyllama.syntaxColors.v1";

function normalizeHex(raw: string, fallback: string): string {
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const h = t.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return fallback;
}

export function defaultSyntaxColors(): SyntaxColorMap {
  return { ...TOKYO_NIGHT_SYNTAX_DEFAULTS };
}

export function normalizeSyntaxColors(parsed: Partial<SyntaxColorMap> | null | undefined): SyntaxColorMap {
  const base = defaultSyntaxColors();
  if (!parsed || typeof parsed !== "object") return base;
  const out = { ...base };
  for (const key of Object.keys(base) as SyntaxColorKey[]) {
    const v = parsed[key];
    if (typeof v === "string") out[key] = normalizeHex(v, base[key]);
  }
  return out;
}

export function loadSyntaxColors(): SyntaxColorMap {
  if (typeof localStorage === "undefined") return defaultSyntaxColors();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSyntaxColors();
    return normalizeSyntaxColors(JSON.parse(raw) as Partial<SyntaxColorMap>);
  } catch {
    return defaultSyntaxColors();
  }
}

export function saveSyntaxColors(colors: SyntaxColorMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
    /* ignore */
  }
}

/** Push syntax token colors to CSS variables (CodeMirror reads `var(--syntax-*)`). */
export function applySyntaxColorsToDocument(colors: SyntaxColorMap): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const field of SYNTAX_COLOR_FIELDS) {
    root.style.setProperty(`--syntax-${field.key}`, colors[field.key]);
  }
  root.style.setProperty("--syntax-default", colors.default);
  root.style.setProperty("--syntax-invalid", colors.invalid);
  root.style.setProperty("--syntax-bool", colors.number);
  root.style.setProperty("--syntax-class", colors.type);
  root.style.setProperty("--syntax-parameter", colors.variable);
  root.style.setProperty("--syntax-punctuation", colors.operator);
  root.style.setProperty("--syntax-tag", colors.type);
  root.style.setProperty("--syntax-attribute", colors.property);
  root.style.setProperty("--syntax-meta", colors.comment);
  root.style.setProperty("--syntax-heading", colors.variable);
  root.style.setProperty("--syntax-link", colors.keyword);
  root.style.setProperty("--syntax-strong", colors.keyword);
  root.style.setProperty("--syntax-emphasis", colors.type);
  root.style.setProperty("--syntax-regexp", colors.string);
}
