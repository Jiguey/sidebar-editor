/** Map a filename to a VS Code language id for Seti `languageIds` lookup. */
export function setiLanguageIdFromFileName(fileName: string): string | null {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const lower = base.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot > 0 ? lower.slice(dot + 1) : "";

  if (!ext) {
    if (lower === "dockerfile") return "dockerfile";
    if (lower === "makefile") return "makefile";
    return null;
  }

  const byExt: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    mts: "typescript",
    cts: "typescript",
    js: "javascript",
    jsx: "javascriptreact",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    jsonc: "jsonc",
    jsonl: "jsonl",
    md: "markdown",
    mdx: "markdown",
    rs: "rust",
    py: "python",
    pyw: "python",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    styl: "stylus",
    vue: "vue",
    svelte: "svelte",
    go: "go",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    cs: "csharp",
    fs: "fsharp",
    fsx: "fsharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    sh: "shellscript",
    bash: "shellscript",
    zsh: "shellscript",
    fish: "shellscript",
    ps1: "powershell",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    sql: "sql",
    ex: "elixir",
    exs: "elixir",
    erl: "erl",
    hs: "haskell",
    lua: "lua",
    r: "r",
    dart: "dart",
    clj: "clojure",
    cljs: "clojure",
    coffee: "coffeescript",
    gql: "graphql",
    graphql: "graphql",
    tf: "terraform",
    hcl: "terraform",
    zig: "zig",
    v: "v",
    dockerfile: "dockerfile",
  };

  return byExt[ext] ?? null;
}
