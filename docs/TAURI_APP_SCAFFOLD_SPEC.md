# Tauri Desktop App Scaffold Spec

Reusable blueprint for building **minimal, Cursor/VS Code–style** desktop apps with **Tauri 2 + Vite + Svelte 5**. Derived from [Tiny Llama](../spec.md); copy this doc when starting a new project and fill in the bracketed placeholders.

---

## 1. Goals

- **Single-window workbench** with resizable panes, dark-first UI, and small surface area.
- **Rust backend** for OS integration; **Svelte frontend** for UI; **Vite** for dev/build.
- **Two icon layers**: UI chrome (vector components) vs file tree (theme pack + fallback).
- **Settings** as modal in main window *and* optional dedicated Tauri window.
- **Tests** that run fast in CI; optional integration tests gated by env flags.

---

## 2. Stack

| Layer | Choice | Notes |
|--------|--------|-------|
| Shell | **Tauri 2** | `src-tauri/`, `@tauri-apps/api`, plugins as needed |
| UI | **Svelte 5** | Runes: `$state`, `$props`, `$derived`, `$effect`, snippets |
| Bundler | **Vite 6** | Multi-page: `index.html` + optional `settings.html` |
| CSS | **Tailwind CSS 4** | `@tailwindcss/vite`; design tokens as CSS variables |
| UI primitives | **bits-ui** + **shadcn-svelte** (`components.json`) | Dialogs, selects, dropdowns |
| UI icons | **phosphor-svelte** | Per-icon imports + `sveltePhosphorOptimize()` in Vite |
| File icons | **vscode-icons** (default) + **@vscode/codicons** (fallback) | See §5 |
| Package manager | **pnpm** | See §4 |
| Tests | **Vitest** | Node environment, `$lib` alias |

---

## 3. Project layout

```
[app-name]/
├── index.html                 # Main window entry
├── settings.html              # Optional settings window entry
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── vitest.config.ts
├── components.json            # shadcn-svelte config
├── src/
│   ├── main.ts                # Global CSS + mount App
│   ├── settings-main.ts       # Same CSS + mount SettingsWindowRoot
│   ├── App.svelte             # Thin shell → WorkbenchShell
│   ├── lib/
│   │   ├── ipc.ts             # Lazy Tauri invoke/listen wrapper
│   │   ├── components/
│   │   │   ├── FileIcon.svelte
│   │   │   └── ui/            # shadcn primitives (Phosphor inside)
│   │   ├── stores/            # settings, workbench, iconTheme, …
│   │   └── icon-packs/        # manifest types, resolve, bundled URLs
│   ├── modules/
│   │   ├── workbench/         # WorkbenchShell, StatusBar, tabs, …
│   │   ├── explorer/          # RightSidebar, FileTree, …
│   │   └── settings/          # SettingsPane, SettingsWindowRoot
│   └── styles/
│       ├── globals.css          # Default dark tokens + Tailwind
│       └── workbench-themes.css # Optional theme presets
├── static/
│   └── icon-packs/vscode-icons/   # manifest.json + icons/*.svg
├── scripts/
│   ├── free-dev-port.mjs
│   └── sync-vscode-icons.mjs
├── tests/
│   ├── README.md
│   ├── unit/
│   └── integration/           # Opt-in via env flags
└── src-tauri/
    ├── tauri.conf.json
    ├── Cargo.toml
    └── src/
        ├── main.rs            # invoke_handler registration
        └── modules/
            ├── commands.rs
            └── icon_pack.rs   # Optional: refresh bundled pack from VSIX
```

### Module convention

- **`src/lib/`** — shared logic, stores, IPC, small components.
- **`src/modules/`** — feature areas (workbench, explorer, settings, agent, …).
- **`src/lib/ipc.ts`** — single façade for Tauri commands; lazy-load API so `vite dev` in browser fails gracefully.

---

## 4. pnpm workflow

**Use pnpm as the only package manager** for consistency and speed.

```bash
# New project
pnpm create tauri-app   # or scaffold manually, then:
pnpm install

# Dev (Tauri — preferred)
pnpm tauri dev

# Dev (browser-only UI — no Rust IPC)
pnpm dev

# Test + production build
pnpm build              # runs tests first, then vite build
pnpm build:skip-tests   # emergency only

# Tests
pnpm test
pnpm test:watch
pnpm test:coverage
```

**`package.json` conventions**

```json
{
  "scripts": {
    "dev": "node scripts/free-dev-port.mjs && vite",
    "build": "pnpm run test && vite build",
    "build:skip-tests": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "tauri": "tauri",
    "sync-icons": "node scripts/sync-vscode-icons.mjs"
  },
  "packageManager": "pnpm@9.x"
}
```

- Commit **`pnpm-lock.yaml`**; do not commit `node_modules/`.
- Gate **`build`** on **`test`** so broken logic never ships in frontend bundles.
- Use **`pnpm tauri dev`** for full-stack work; scripts that chain commands should use `pnpm run …`, not `npm run …`.

---

## 5. Icons

### 5.1 Application UI (workbench chrome)

**Library:** [Phosphor Icons](https://phosphoricons.com/) via `phosphor-svelte`.

**Import pattern** — one icon per file (tree-shake friendly):

```svelte
<script lang="ts">
  import GearIcon from "phosphor-svelte/lib/GearIcon";
  import FolderOpenIcon from "phosphor-svelte/lib/FolderOpenIcon";
</script>

<GearIcon size={20} aria-hidden="true" />
```

**Vite plugin** (order matters: Svelte → Phosphor optimize → Tailwind):

```ts
import { sveltePhosphorOptimize } from "phosphor-svelte/vite";

plugins: [svelte(), sveltePhosphorOptimize(), tailwindcss()],
```

**Where used**

| Area | Examples |
|------|-----------|
| Status bar | Sidebar, rows, folder-open, gear |
| Chat / agent | Chat circle, mic, arrow-up, stop |
| Workbench tabs | File-text, terminal, monitor |
| Right activity strip | Files, git-diff, file-md |
| shadcn UI | Caret, check, X, warning (toasts, dialogs, selects) |

**Do not** use the file-icon pack for toolbar buttons — keep UI icons as inline SVG components.

### 5.2 File explorer (tree icons)

**Separate system** — swappable **icon theme** stored in `iconTheme` (`localStorage` key e.g. `[app].iconTheme.v1`).

| Theme ID | Source | Role |
|----------|--------|------|
| `vscode-icons` | [vscode-icons](https://github.com/yusifaliyevpro/vscode-icons) VSIX → `static/icon-packs/vscode-icons/` | Default; rich per-extension SVGs |
| `codicons` | `@vscode/codicons` + `codicon.css` | Lightweight fallback / user preference |
| `custom` | User folder with `manifest.json` or `icons.json` | Power users |

**Resolution flow** (`FileIcon.svelte`):

1. If theme is `codicons` → map extension/name to `codicon-*` classes.
2. Else load manifest → `resolveIconRelativePath()` → `<img src="…">`.
3. On missing manifest/icon → fall back to codicons.

**Sync bundled pack**

```bash
pnpm run sync-icons   # downloads VSIX, extracts manifest + SVGs to static/
```

**Rust (optional):** `icon_pack_refresh_bundled` command can re-download into app data dir for Tauri builds.

**Attribution:** keep license/name in Settings → Appearance when shipping vscode-icons.

---

## 6. Right sidebar (activity bar pattern)

VS Code–style **secondary pane + fixed activity strip** on the **right** edge.

```
┌──────────────────────────────┬──┐
│  Explorer / Git / Prompt     │▓▓│  ← 34px activity strip
│  (secondary pane)            │▓▓│     (always visible)
│                              │▓▓│
└──────────────────────────────┴──┘
```

**Structure** (`RightSidebar.svelte`)

- Flex row: `.sidebar-secondary` (content) + `.sidebar-icons` (toolbar).
- **`secondaryOpen`** (bindable): toggles content pane; strip stays.
- **`dockedOnly`**: strip-only mode when parent panel is collapsed; clicking an icon expands.
- **Tab click behavior**: same tab + open → collapse secondary; different tab → switch + open.

**Shell integration** (`WorkbenchShell.svelte`)

- Persist pane widths in `localStorage` (e.g. `[app].paneWidths.v1`).
- When secondary collapsed, aside width = **34px** (`RIGHT_ACTIVITY_STRIP_PX`).
- When open, resizable width (defaults: min 200, max ~45% viewport, default ~280).
- `showRightPanel` vs `rightExplorerSecondaryOpen` are separate: panel can hide entirely vs collapse tree only.

**Activity strip styling**

```css
.sidebar-icons {
  width: 34px;
  background: var(--activity-bar-bg);
  border-left: 1px solid var(--activity-bar-border);
}
.icon-btn.active {
  color: var(--activity-bar-active);
  border-left: 2px solid var(--activity-bar-active-border);
}
```

Define aliases in `globals.css` if components use alternate names:

```css
--activity-bar-inactive: var(--activity-bar-fg);
--activity-bar-foreground: var(--activity-bar-active);
--activity-bar-hover-bg: color-mix(in srgb, var(--activity-bar-active) 8%, transparent);
--activity-bar-active-border: var(--activity-bar-accent);
--activity-bar-border: var(--sidebar-border);
```

---

## 7. Vite + Tauri + Svelte wiring

### 7.1 Vite

```ts
// vite.config.ts — essentials
export default defineConfig({
  plugins: [svelte(), sveltePhosphorOptimize(), tailwindcss()],
  resolve: { alias: { $lib: path.resolve(import.meta.dirname, "./src/lib") } },
  server: {
    port: 14200,           // non-default port; match tauri.conf.json devUrl
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        settings: "settings.html",   // omit if no settings window
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@codemirror")) return "codemirror";
            if (id.includes("@tauri-apps")) return "tauri";
          }
        },
      },
    },
  },
});
```

- Run **`scripts/free-dev-port.mjs`** before dev to avoid stale processes on the fixed port.
- Plugin order: **Svelte before Tailwind** so `.svelte` files are not parsed as raw CSS.

### 7.2 Tauri

```json
// src-tauri/tauri.conf.json — key fields
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:14200",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [{ "label": "main", "title": "[App Name]", "width": 1200, "height": 800 }]
  }
}
```

- Register commands in `main.rs` → `modules/commands.rs`.
- Optional second window: `open_settings_window` builds a `WebviewWindow` loading `/settings.html`.
- Capabilities: grant `core:default` (+ plugins) to `main` and `settings` labels.

### 7.3 Svelte entry points

**Main** (`src/main.ts`):

```ts
import "./styles/globals.css";
import "./styles/workbench-themes.css";
import "@vscode/codicons/dist/codicon.css";
import App from "./App.svelte";
import { mount } from "svelte";

mount(App, { target: document.getElementById("app")! });
```

**Settings window** (`src/settings-main.ts`):

```ts
import "./styles/globals.css";
import "./styles/workbench-themes.css";
import "@vscode/codicons/dist/codicon.css";
import SettingsWindowRoot from "./modules/settings/SettingsWindowRoot.svelte";
import { mount } from "svelte";

mount(SettingsWindowRoot, { target: document.getElementById("app")! });
```

**IPC façade** — lazy dynamic import of `@tauri-apps/api` so browser-only dev shows a clear error instead of crashing at import time.

---

## 8. Default dark mode & minimal appearance

### 8.1 Design principles

- **Dark by default** — `:root` and `.dark` share the same VS Code Dark–inspired palette (no light flash).
- **Flat chrome** — low contrast borders (`#3c3c3c`), subtle elevation via `#252526` / `#2d2d30`.
- **System UI font** — no custom webfont for shell text.
- **Compact headers** — `--workbench-row-header-height: 26px`, shell header ~30px.
- **Thin scrollbars** on editor/terminal panes only.
- **Accent sparingly** — primary blue `#007acc` for focus rings, active tabs, links.

### 8.2 Core tokens (`globals.css`)

| Token | Default | Use |
|-------|---------|-----|
| `--background` | `#1e1e1e` | App shell |
| `--foreground` | `#d4d4d4` | Body text |
| `--card` / `--sidebar` | `#252526` | Sidebars, panels |
| `--secondary` | `#2d2d30` | Elevated rows |
| `--muted` / `--border` | `#3c3c3c` | Dividers, inputs |
| `--muted-foreground` | `#a0a0a0` | Secondary labels |
| `--primary` | `#007acc` | Accent, focus ring |
| `--destructive` | `#f14c4c` | Errors |
| `--success` | `#89d185` | OK states |
| `--editor-bg` | `#1e1e1e` | CodeMirror / xterm |
| `--editor-selection` | `#264f78` | Selection |
| `--activity-bar-bg` | `#333333` | Right strip |
| `--activity-bar-fg` | `#808080` | Inactive icons |
| `--activity-bar-active` | `#d4d4d4` | Active icon |
| `--activity-bar-accent` | `#007acc` | Active indicator |
| `--radius` | `0.625rem` | shadcn rounding |

Apply theme presets via `data-workbench-theme="…"` on `<html class="dark">` (see `workbench-themes.css` for Catppuccin, Tokyo Night, One Dark, Dracula, GitHub Dark).

### 8.3 Workbench layout constants

| Constant | Value | Purpose |
|----------|-------|---------|
| Left pane default | 320px | Chat / primary sidebar |
| Right pane default | 280px | Explorer secondary |
| Bottom dock default | 220px | Terminal / output |
| Activity strip | 34px | Fixed icon column |
| Pane min width | 200px | Resize clamp |
| Pane max width | 560px or 45% viewport | Resize clamp |

Persist layout in `localStorage`; restore on mount.

---

## 9. Settings popup — look & feel

### 9.1 Two presentation modes

| Mode | Trigger | Layout |
|------|---------|--------|
| **Modal** | Gear in main window | Centered overlay on workbench |
| **Page** | `openSettingsWindow()` (Tauri) | Full dedicated window, no backdrop |

Same component: **`SettingsPane.svelte`** with `variant="modal" | "page"`.

### 9.2 Modal chrome (intentionally separate from workbench tokens)

Settings uses a **fixed neutral palette** so it reads as a focused dialog, not another editor pane:

| Element | Style |
|---------|--------|
| Backdrop | `rgba(0,0,0,0.55)` + `backdrop-filter: blur(2px)` |
| Dialog | `960×780` max, `#262626` bg, `#3f3f3f` border, `10px` radius, deep shadow |
| Header | `#e8e8e8` title 15px/600, bottom border `#333` |
| Nav rail | `168px`, `#1f1f1f`, grouped sections with uppercase 10px labels |
| Nav item | 12px, `#a3a3a3` → hover `#e5e5e5` / `#2a2a2a` → active `#fafafa` / `#333` |
| Body | Scrollable, 16px padding, 14px vertical stack gap |
| Fields | Label 12px `#a3a3a3`; input `#1c1c1c` bg, `#404040` border, 6px radius |
| Footer | Save / Cancel |
| Close | `×` text button, 28px hit target |
| Active provider | Green pill (`#86c9b7` on `#1e2a1e`) + dot on nav item |

### 9.3 Structure

```
┌─────────────────────────────────────────┐
│ Settings                            [×] │
├──────────┬──────────────────────────────┤
│ PROVIDERS│  Section title + actions     │
│  Ollama  │                              │
│  …       │  Fields, notes, tables       │
│ Tools    │                              │
│ Appearance                              │
│ Keybindings                             │
├──────────┴──────────────────────────────┤
│                        [Cancel] [Save]  │
└─────────────────────────────────────────┘
```

- **Left nav** with optional **group headers** (`Providers`, …).
- **One section visible** at a time; state loads on open (`$effect` when `visible` flips true).
- **Escape** closes modal (nested tool editor closes first).
- **Backdrop click** closes modal variant only.

### 9.4 Settings window root

`SettingsWindowRoot.svelte`: wraps `ModeWatcher`, applies workbench theme from store, mounts `<SettingsPane open variant="page" onClose={() => getCurrentWindow().close()} />`.

---

## 10. Test suite design

### 10.1 Philosophy

- **Unit tests first** — pure TS in `src/lib/` (path utils, icon resolve, providers, policy).
- **No Tauri in default CI** — Vitest runs in **Node** environment, fast and headless.
- **Integration tests opt-in** — env flag skips when external services absent (e.g. local Ollama).
- **`build` runs tests** — regressions block release bundles.

### 10.2 Layout

```
tests/
├── README.md              # How to run; env flags documented
├── unit/
│   ├── pathUtils.test.ts
│   ├── iconResolve.test.ts
│   └── …
└── integration/
    └── ollama.test.ts     # RUN_OLLAMA_TESTS=1 to enable
```

### 10.3 Vitest config

```ts
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { $lib: path.resolve(__dirname, "./src/lib") },
  },
});
```

### 10.4 Patterns

```ts
// Opt-in integration
const runOllama = process.env.RUN_OLLAMA_TESTS === "1";
describe.skipIf(!runOllama)("ollama integration", () => { … });

// Pure function unit test
describe("icon resolve", () => {
  it("resolves extension", () => {
    expect(resolveIconRelativePath(manifest, "app.ts", false)).toBe("icons/typescript.svg");
  });
});
```

### 10.5 Scripts

| Script | Purpose |
|--------|---------|
| `pnpm test` | All default (skipped integration excluded) |
| `pnpm test:watch` | Dev loop |
| `pnpm test:coverage` | Coverage report |
| `pnpm test:ollama` | Single integration file with flag set |

Document env overrides in `tests/README.md` (`OLLAMA_HOST`, `OLLAMA_TEST_MODEL`, …).

**Future:** Tauri E2E is heavy — keep logic in unit/integration tests until necessary.

---

## 11. New project checklist

Copy this file and tick through when scaffolding:

- [ ] `pnpm create tauri-app` (Svelte + TypeScript) or clone template
- [ ] Add Tailwind 4, bits-ui, shadcn-svelte, phosphor-svelte, codicons
- [ ] Create `globals.css` tokens (§8) + `workbench-themes.css` if theming
- [ ] Wire Vite: `$lib` alias, port 14200, multi-page inputs, Phosphor optimize
- [ ] Structure `src/lib/` + `src/modules/workbench|explorer|settings`
- [ ] Implement `ipc.ts` lazy Tauri wrapper
- [ ] Build `WorkbenchShell` with resizable panes + `localStorage` persistence
- [ ] Build `RightSidebar` activity strip (§6)
- [ ] Add `FileIcon` + icon theme store + `pnpm sync-icons`
- [ ] Build `SettingsPane` modal + optional `settings.html` window
- [ ] Add Vitest + unit tests for core lib; gate `build` on `test`
- [ ] Add `packageManager` field + commit `pnpm-lock.yaml`
- [ ] Add app icons under `src-tauri/icons/` + `bundle.icon` in Tauri config

---

## 12. Related docs

- [spec.md](../spec.md) — Tiny Llama product/engineering spec
- [OVERVIEW.md](../OVERVIEW.md) — high-level architecture summary
- [tests/README.md](../tests/README.md) — running tests and integration flags