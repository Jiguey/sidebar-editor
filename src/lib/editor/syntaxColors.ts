/** Tokyo Night syntax token colors. */
export const TOKYO_NIGHT_SYNTAX_DEFAULTS = {
  keyword: "#bb9af7",
  function: "#7aa2f7",
  variable: "#c0caf5",
  number: "#ff9e64",
  string: "#9ece6a",
  type: "#2ac3de",
  operator: "#89ddff",
  property: "#73daca",
  comment: "#565f89",
  default: "#c0caf5",
  invalid: "#f7768e",
  heading: "#7aa2f7",
  link: "#73daca",
  emphasis: "#bb9af7",
  strong: "#c0caf5",
  meta: "#565f89",
  punctuation: "#89ddff",
  tag: "#f7768e",
  regexp: "#b4f9f8",
} as const;

/** Monokai–style token colors (kept as a selectable preset). */
export const MONOKAI_SYNTAX_DEFAULTS = {
  keyword: "#f92672",
  function: "#a6e22e",
  variable: "#f8f8f2",
  number: "#ae81ff",
  string: "#e6db74",
  type: "#66d9e8",
  operator: "#f92672",
  property: "#a6e22e",
  comment: "#75715e",
  default: "#f8f8f2",
  invalid: "#f92672",
  heading: "#a6e22e",
  link: "#66d9e8",
  emphasis: "#f92672",
  strong: "#f8f8f2",
  meta: "#75715e",
  punctuation: "#f8f8f2",
  tag: "#f92672",
  regexp: "#e6db74",
} as const;

export type SyntaxColorKey = keyof typeof MONOKAI_SYNTAX_DEFAULTS;

export type SyntaxColorMap = Record<SyntaxColorKey, string>;

export const SYNTAX_COLOR_FIELDS: {
  key: SyntaxColorKey;
  label: string;
  hint: string;
  group?: "code" | "markdown";
}[] = [
  { key: "keyword", label: "Keywords", hint: "if · return · const · class", group: "code" },
  { key: "function", label: "Functions", hint: "myFunction() · render()", group: "code" },
  { key: "variable", label: "Variables", hint: "myVar · count · data", group: "code" },
  { key: "number", label: "Constants / numbers", hint: "MAX_SIZE · 42 · 3.14", group: "code" },
  { key: "string", label: "Strings", hint: '"hello world" · \'arch linux\'', group: "code" },
  { key: "type", label: "Types / classes", hint: "String · MyClass · Vec", group: "code" },
  { key: "operator", label: "Operators", hint: "= · && · => · !", group: "code" },
  { key: "property", label: "Properties / fields", hint: "obj.name · self.value", group: "code" },
  { key: "comment", label: "Comments", hint: "// this is a comment", group: "code" },
  { key: "punctuation", label: "Punctuation", hint: ". , ; : ( )", group: "code" },
  { key: "tag", label: "Tags", hint: "HTML/XML tags", group: "code" },
  { key: "regexp", label: "Regex", hint: "/pattern/ flags", group: "code" },
  { key: "default", label: "Default text", hint: "Unclassified tokens", group: "code" },
  { key: "invalid", label: "Invalid / error", hint: "Syntax errors", group: "code" },
  { key: "heading", label: "Markdown headings", hint: "# Title", group: "markdown" },
  { key: "link", label: "Markdown links", hint: "[text](url)", group: "markdown" },
  { key: "emphasis", label: "Markdown emphasis", hint: "*italic*", group: "markdown" },
  { key: "strong", label: "Markdown strong", hint: "**bold**", group: "markdown" },
  { key: "meta", label: "Markdown meta", hint: "Frontmatter · code fence info", group: "markdown" },
];

const STORAGE_KEY = "sidebar.syntaxColors.v2";
const STORAGE_KEY_V1 = "sidebar.syntaxColors.v1";

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

function migrateFromV1(parsed: Partial<SyntaxColorMap>): SyntaxColorMap {
  const out = normalizeSyntaxColors(parsed);
  if (parsed.heading == null) out.heading = out.function;
  if (parsed.link == null) out.link = out.property;
  if (parsed.emphasis == null) out.emphasis = out.keyword;
  if (parsed.strong == null) out.strong = out.variable;
  if (parsed.meta == null) out.meta = out.comment;
  if (parsed.punctuation == null) out.punctuation = out.operator;
  if (parsed.tag == null) out.tag = out.type;
  if (parsed.regexp == null) out.regexp = out.string;
  return out;
}

export function loadSyntaxColors(): SyntaxColorMap {
  if (typeof localStorage === "undefined") return defaultSyntaxColors();
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) return normalizeSyntaxColors(JSON.parse(rawV2) as Partial<SyntaxColorMap>);
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const migrated = migrateFromV1(JSON.parse(rawV1) as Partial<SyntaxColorMap>);
      saveSyntaxColors(migrated);
      return migrated;
    }
    return defaultSyntaxColors();
  } catch {
    return defaultSyntaxColors();
  }
}

export function saveSyntaxColors(colors: SyntaxColorMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    localStorage.removeItem(STORAGE_KEY_V1);
  } catch {
    /* ignore */
  }
}

export const CSS_VAR_BY_KEY: Record<SyntaxColorKey, string> = {
  keyword: "--syntax-keyword",
  function: "--syntax-function",
  variable: "--syntax-variable",
  number: "--syntax-number",
  string: "--syntax-string",
  type: "--syntax-type",
  operator: "--syntax-operator",
  property: "--syntax-property",
  comment: "--syntax-comment",
  default: "--syntax-default",
  invalid: "--syntax-invalid",
  heading: "--syntax-heading",
  link: "--syntax-link",
  emphasis: "--syntax-emphasis",
  strong: "--syntax-strong",
  meta: "--syntax-meta",
  punctuation: "--syntax-punctuation",
  tag: "--syntax-tag",
  regexp: "--syntax-regexp",
};

const SYNTAX_CSS_VARS = [
  ...Object.values(CSS_VAR_BY_KEY),
  "--syntax-bool",
  "--syntax-class",
  "--syntax-parameter",
  "--syntax-attribute",
] as const;

/** Push syntax token colors to CSS variables (CodeMirror reads `var(--syntax-*)`). */
export function applySyntaxColorsToDocument(colors: SyntaxColorMap): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of Object.keys(CSS_VAR_BY_KEY) as SyntaxColorKey[]) {
    root.style.setProperty(CSS_VAR_BY_KEY[key], colors[key]);
  }
  root.style.setProperty("--syntax-bool", colors.number);
  root.style.setProperty("--syntax-class", colors.type);
  root.style.setProperty("--syntax-parameter", colors.variable);
  root.style.setProperty("--syntax-attribute", colors.property);
}

/** Remove persisted inline overrides so workbench theme CSS variables take effect. */
export function clearSyntaxInlineOverrides(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const cssVar of SYNTAX_CSS_VARS) {
    root.style.removeProperty(cssVar);
  }
}

/** Read active workbench theme syntax colors from computed styles (after inline overrides are cleared). */
export function readSyntaxColorsFromDocument(): SyntaxColorMap {
  if (typeof document === "undefined") return defaultSyntaxColors();
  const s = getComputedStyle(document.documentElement);
  const pick = (varName: string, fallback: string) => {
    const v = s.getPropertyValue(varName).trim();
    return v || fallback;
  };
  const base = defaultSyntaxColors();
  const out = { ...base };
  for (const key of Object.keys(CSS_VAR_BY_KEY) as SyntaxColorKey[]) {
    out[key] = pick(CSS_VAR_BY_KEY[key], base[key]);
  }
  return out;
}
