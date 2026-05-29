# Editor

> **Status:** 🔶 **PARTIAL** — Core CodeMirror + grammars work; wrapping, Prettier, and full syntax/markdown theming are spec’d in [20-editor-formatting-and-theming.md](20-editor-formatting-and-theming.md).

---

## Language Support

### Language Detection

`getLanguageFromPath()` in `src/lib/ipc.ts` maps file extensions to language IDs.

### Loaded Grammars (15)

| Language | CodeMirror Pack | Status |
|----------|-----------------|--------|
| JavaScript | `@codemirror/lang-javascript` | ✅ |
| TypeScript | `@codemirror/lang-javascript` (typescript: true) | ✅ |
| HTML | `@codemirror/lang-html` | ✅ |
| CSS | `@codemirror/lang-css` | ✅ |
| JSON | `@codemirror/lang-json` | ✅ |
| Markdown | `@codemirror/lang-markdown` | ✅ |
| Rust | `@codemirror/lang-rust` | ✅ |
| Python | `@codemirror/lang-python` | ✅ |
| YAML | `@codemirror/lang-yaml` | ✅ |
| Go | `@codemirror/lang-go` | ✅ |
| C/C++ | `@codemirror/lang-cpp` | ✅ |
| Java | `@codemirror/lang-java` | ✅ |
| SQL | `@codemirror/lang-sql` | ✅ |
| XML | `@codemirror/lang-xml` | ✅ |
| Svelte | `codemirror-lang-svelte` | ✅ |
| Vue | Falls back to HTML | ✅ |

**Not loaded:** TOML, Shell → plain text until packs added.

---

## Syntax Colors

Custom highlight via `src/lib/editor/syntaxTheme.ts`:
- Uses `--syntax-*` CSS variables + `tl-syn-*` classes in `styles/editor-syntax.css`
- Settings → Appearance → Syntax: **9 token types** editable today
- **Gap:** Markdown (`.md`) tokens like headings/links often look wrong because `heading`, `link`, `emphasis`, etc. are aliased to other keys, not user-facing fields — see [20-editor-formatting-and-theming.md](20-editor-formatting-and-theming.md)
- Editor chrome (`--editor-bg`, gutter, selection) follows workbench preset only; not fully editable in Settings

---

## Formatting & Wrapping (Planned)

| Feature | Status |
|---------|--------|
| Line wrap (`EditorView.lineWrapping`) | ❌ Not started |
| Prettier (format document / format on save) | ❌ Not started |
| Full syntax + editor chrome in Settings | ❌ Not started |

Details: [20-editor-formatting-and-theming.md](20-editor-formatting-and-theming.md).

---

## Git Diff Mode

`src/lib/git/openChangedFile.ts`:

1. `openGitDiffFile()` sets `diffBase` from `git_file_at_head`
2. `diffDecorations.ts` highlights added/changed lines
3. Editor is read-only in diff mode

---

## Editor Features

| Feature | Implementation | Status |
|---------|----------------|--------|
| Line numbers | CodeMirror `lineNumbers()` | ✅ |
| Active line highlight | `highlightActiveLine()` | ✅ |
| Fold gutter | `foldGutter()` | ✅ |
| Bracket matching | `bracketMatching()` | ✅ |
| Auto-close brackets | `closeBrackets()` | ✅ |
| Search | `searchKeymap` | ✅ |
| History (undo/redo) | `history()` | ✅ |
| Middle-click scroll | Custom `middleClickScroll()` | ✅ |
| Scroll past end | `scrollPastEnd()` | ✅ |

---

## Editor State Management

`EditorSurface.svelte`:
- Keeps `Map<path, EditorState>` for tab persistence
- Preserves undo history and cursor position on tab switch
- Document changes update `files.updateFileContent()` and mark buffer dirty
- Save writes via `writeFile()` IPC

---

## Known Limitations

| Limitation | Status | Notes |
|------------|--------|-------|
| LSP integration | ❌ Not started | No completions/diagnostics |
| Cmd+K inline edit | ❌ Not started | Chat + tools only |
| Syntax colors per theme | 🔶 Partial | 9 fields in Settings; markdown tokens weak — [20](20-editor-formatting-and-theming.md) |
| Line wrap | ❌ Not started | [20](20-editor-formatting-and-theming.md) |
| Prettier | ❌ Not started | [20](20-editor-formatting-and-theming.md) |
