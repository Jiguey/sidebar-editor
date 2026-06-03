# Theming

> **Status:** ✅ **COMPLETE**

---

## Color Systems Overview

Tiny Llama has **three independent color systems**:

| System | Scope | Customizable | Status |
|--------|-------|--------------|--------|
| Workbench theme | Global UI chrome | Yes (presets) | ✅ |
| File icons | Explorer icons | Yes (theme packs) | ✅ |
| Syntax colors | Editor tokens | Yes (Settings → Appearance → Syntax) | ✅ |

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
| `rose-pine` | ✅ |

**Rosé Pine** uses VS Code Dark workbench chrome (`--background` `#1e1e1e`) with Rosé Pine editor surface, syntax tokens, and terminal ANSI (from [rose-pine/vscode](https://github.com/rose-pine/vscode)).

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

Called from `WorkbenchShell.svelte` and the settings window when theme changes.

**Editor/syntax sync:** changing the workbench theme clears persisted inline `--editor-*` / `--syntax-*` overrides and reads colors from the active theme CSS (`editorChrome.syncFromActiveTheme()`, `syntaxTheme.syncFromActiveTheme()`). This runs on theme change in Settings → General and when `$settings.workbenchTheme` updates after save.

**Default theme:** `globals.css` sets `--editor-bg: var(--background)` (`#1e1e1e`) so the code editor and welcome screen share the same base fill. Syntax token defaults remain Monokai-style in `editor-syntax.css` until overridden in Appearance or by a workbench preset.

### Key CSS Variables

| Variable Group | Used By | Status |
|----------------|---------|--------|
| `--background`, `--foreground`, `--sidebar-*`, `--border` | Layout chrome | ✅ |
| `--editor-bg`, `--editor-fg`, `--editor-gutter-fg`, `--editor-line-hl`, `--editor-selection` | CodeMirror | ✅ |
| `--terminal-ansi-*` | xterm.js | ✅ |
| `--workbench-tab-active-indicator` | Tab bar | ✅ |

**Persistence:** `settings.workbenchTheme` in `localStorage` (`tinyllama.settings.v4`). Editor chrome and syntax colors are stored separately (`tinyllama.editorChrome.v1`, `tinyllama.syntaxColors.v2`) and sync from the active theme when the workbench preset changes.

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

### Configuration

`src/lib/stores/syntaxTheme.ts` + `src/lib/editor/syntaxColors.ts`:
- Uses `--syntax-*` CSS variables on `:root`
- Configurable in **Settings → Appearance → Syntax** (code + markdown token groups)
- **Sync from theme:** workbench preset change updates runtime colors; use Appearance pickers to persist custom overrides

### CSS Variables (representative)

| Variable | Purpose |
|----------|---------|
| `--syntax-keyword` | Keywords |
| `--syntax-string` | Strings |
| `--syntax-number` | Numbers / bools |
| `--syntax-comment` | Comments |
| `--syntax-function` | Functions |
| `--syntax-variable` | Variables / parameters |
| `--syntax-type` | Types / classes |
| `--syntax-operator` | Operators |
| `--syntax-property` | Properties / attributes |
| `--syntax-heading` | Markdown headings |
| `--syntax-link` | Markdown links |
| `--syntax-emphasis` / `--syntax-strong` | Markdown emphasis |
| `--syntax-tag` / `--syntax-regexp` | Tags, regex |

## Editor Chrome

Separate from syntax tokens — **Settings → Appearance → Editor**:

| Variable | Purpose |
|----------|---------|
| `--editor-bg` | Editor pane background |
| `--editor-fg` | Default text |
| `--editor-gutter-fg` | Line numbers |
| `--editor-line-hl` | Active line highlight |
| `--editor-selection` | Selection background |
| `--editor-cursor` | Caret |

Defaults in `EDITOR_CHROME_DEFAULTS` (`src/lib/editor/editorChrome.ts`) match VS Code Dark (`#1e1e1e` background).

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
