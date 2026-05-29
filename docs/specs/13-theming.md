# Theming

> **Status:** ✅ **COMPLETE**

---

## Color Systems Overview

Tiny Llama has **three independent color systems**:

| System | Scope | Customizable | Status |
|--------|-------|--------------|--------|
| Workbench theme | Global UI chrome | Yes (presets) | ✅ |
| File icons | Explorer icons | Yes (theme packs) | ✅ |
| Syntax colors | Editor tokens | Yes (Settings) — **partial** (9 fields; markdown weak) | 🔶 |

---

## Workbench Theme

### Token Sources

| File | Role | Status |
|------|------|--------|
| `src/styles/globals.css` | Default `:root` / `.dark` tokens (VS Code Dark palette) | ✅ |
| `src/styles/workbench-themes.css` | Alternate presets via `[data-workbench-theme="..."]` | ✅ |
| `src/lib/workbench-theme.ts` | Preset registry + `applyWorkbenchTheme()` | ✅ |

### Available Presets

| Theme ID | Status |
|----------|--------|
| `vscode-dark` (default) | ✅ |
| `cursor-dark` | ✅ |
| `catppuccin-mocha` | ✅ |
| `tokyo-night` | ✅ |
| `one-dark-pro` | ✅ |
| `tiny-llama` | ✅ |
| `dracula` | ✅ |
| `github-dark` | ✅ |

### Application Mechanism

```typescript
applyWorkbenchTheme(id) {
  if (id === "vscode-dark") {
    document.documentElement.removeAttribute("data-workbench-theme");
  } else {
    document.documentElement.setAttribute("data-workbench-theme", id);
  }
}
```

Called from `WorkbenchShell.svelte` and settings window when theme changes.

### Key CSS Variables

| Variable Group | Used By | Status |
|----------------|---------|--------|
| `--background`, `--foreground`, `--sidebar-*`, `--border` | Layout chrome | ✅ |
| `--editor-bg`, `--editor-fg`, `--editor-gutter-fg`, `--editor-line-hl`, `--editor-selection` | CodeMirror | ✅ |
| `--terminal-ansi-*` | xterm.js | ✅ |
| `--workbench-tab-active-indicator` | Tab bar | ✅ |

**Persistence:** `settings.workbenchTheme` in `localStorage` (`tinyllama.settings.v3`).

---

## Icon Themes

### Icon Theme Store

`src/lib/stores/iconTheme.ts`:
- Storage key: `tinyllama.iconTheme.v2`
- Default theme: **`seti`** (Cursor-style)

### Available Themes

| Theme | Description | Status |
|-------|-------------|--------|
| `seti` | Seti font icons with per-file colors | ✅ |
| `vscode-icons` | VS Code SVG icons | ✅ |
| `codicons` | VS Code icon font (single-tone) | ✅ |
| `custom` | User-provided folder with manifest | ✅ |

### Seti Icons (Default)

**Resolution order** (`src/lib/icon-packs/resolveSeti.ts`):

1. `fileNames` exact match (e.g., `dockerfile`, `makefile`)
2. `fileExtensions` (e.g., `ts` → `_typescript`)
3. `languageIds` via `setiLanguageIdFromFileName()`
4. Default `file` icon

**Manifest:** `static/icon-packs/seti/manifest.json`

Each icon definition contains:
- `fontCharacter` — private-use escape
- `fontColor` — hex color per icon type

**Note:** Seti folders use codicons (`codicon-folder`), not Seti folder glyphs.

### VS Code Icons

- Resolution: `src/lib/icon-packs/resolve.ts`
- Bundled SVGs: `static/icon-packs/vscode-icons/icons/`
- Colors embedded in SVG assets

### Custom Icon Packs

User picks folder via Tauri dialog. Expects `manifest.json` or `icons.json` + `icons/` directory.

---

## Syntax Colors

> **Planned improvements:** full token list (heading, link, emphasis, …), editor chrome colors, markdown preview — [20-editor-formatting-and-theming.md](20-editor-formatting-and-theming.md).

### Configuration

`src/lib/editor/syntaxTheme.ts`:
- Uses `--syntax-*` CSS variables
- Configurable in Settings → Syntax

### CSS Variables

| Variable | Purpose |
|----------|---------|
| `--syntax-keyword` | Keywords |
| `--syntax-string` | Strings |
| `--syntax-number` | Numbers |
| `--syntax-comment` | Comments |
| `--syntax-function` | Functions |
| `--syntax-variable` | Variables |
| `--syntax-type` | Types |
| `--syntax-operator` | Operators |

---

## Terminal Colors

`--terminal-ansi-*` variables from workbench theme:

| Variables |
|-----------|
| `--terminal-ansi-black`, `--terminal-ansi-bright-black` |
| `--terminal-ansi-red`, `--terminal-ansi-bright-red` |
| `--terminal-ansi-green`, `--terminal-ansi-bright-green` |
| `--terminal-ansi-yellow`, `--terminal-ansi-bright-yellow` |
| `--terminal-ansi-blue`, `--terminal-ansi-bright-blue` |
| `--terminal-ansi-magenta`, `--terminal-ansi-bright-magenta` |
| `--terminal-ansi-cyan`, `--terminal-ansi-bright-cyan` |
| `--terminal-ansi-white`, `--terminal-ansi-bright-white` |
