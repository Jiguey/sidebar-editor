<script lang="ts">
  import { get } from "svelte/store";
  import { iconTheme } from "$lib/stores/iconTheme";
  import { resolveIconRelativePath } from "$lib/icon-packs/resolve";
  import { resolveSetiIcon, setiFontCharacterToChar } from "$lib/icon-packs/resolveSeti";

  interface Props {
    name: string;
    isDir?: boolean;
    expanded?: boolean;
    size?: number;
  }

  let { name, isDir = false, expanded = false, size = 16 }: Props = $props();

  let src = $state<string | null>(null);
  let useCodicon = $state(true);
  let useSeti = $state(false);
  let setiChar = $state("");
  let setiColor = $state("#d4d4d4");
  let codiconClass = $state("codicon-file");

  function codiconFor(name: string, isDir: boolean, expanded: boolean): string {
    if (isDir) return expanded ? "codicon-folder-opened" : "codicon-folder";
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "vue", "svelte"].includes(ext)) {
      return "codicon-file-code";
    }
    if (ext === "json" || ext === "jsonc") return "codicon-json";
    if (ext === "md" || ext === "mdx") return "codicon-markdown";
    if (ext === "py") return "codicon-python";
    if (["css", "scss", "less"].includes(ext)) return "codicon-symbol-color";
    return "codicon-file";
  }

  function showCodicon(name: string, isDir: boolean, expanded: boolean) {
    useCodicon = true;
    useSeti = false;
    src = null;
    codiconClass = codiconFor(name, isDir, expanded);
  }

  function showSeti(def: { fontCharacter: string; fontColor: string }) {
    useCodicon = false;
    useSeti = true;
    src = null;
    setiChar = setiFontCharacterToChar(def.fontCharacter);
    setiColor = def.fontColor;
  }

  function showImg(url: string) {
    useCodicon = false;
    useSeti = false;
    src = url;
  }

  function onImgError() {
    const themeId = get(iconTheme).themeId;
    if (themeId === "seti" && !isDir) return;
    showCodicon(name, isDir, expanded);
  }

  $effect(() => {
    const themeId = $iconTheme.themeId;
    void $iconTheme.revision;
    void name;
    void isDir;
    void expanded;

    let cancelled = false;

    void (async () => {
      if (themeId === "codicons") {
        if (!cancelled) showCodicon(name, isDir, expanded);
        return;
      }

      if (themeId === "seti") {
        if (isDir) {
          if (!cancelled) showCodicon(name, isDir, expanded);
          return;
        }
        try {
          const manifest = await iconTheme.ensureSetiManifest();
          if (cancelled || get(iconTheme).themeId !== "seti") return;
          const def = resolveSetiIcon(manifest, name, isDir, expanded);
          if (!def) {
            showCodicon(name, isDir, expanded);
            return;
          }
          showSeti(def);
        } catch {
          if (!cancelled && get(iconTheme).themeId === "seti") {
            showCodicon(name, isDir, expanded);
          }
        }
        return;
      }

      try {
        const manifest = await iconTheme.ensureManifest();
        if (cancelled || get(iconTheme).themeId !== themeId) return;
        if (!manifest) {
          showCodicon(name, isDir, expanded);
          return;
        }

        const rel = resolveIconRelativePath(manifest, name, isDir, expanded);
        if (!rel) {
          showCodicon(name, isDir, expanded);
          return;
        }

        const url = await iconTheme.iconUrl(rel);
        if (cancelled || get(iconTheme).themeId !== themeId) return;
        showImg(url);
      } catch {
        if (!cancelled && get(iconTheme).themeId === themeId) {
          showCodicon(name, isDir, expanded);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

{#if useSeti}
  <span
    class="seti-file-icon"
    aria-hidden="true"
    style="color: {setiColor}; width: {size + 2}px; height: {size}px; --seti-size: {size}px;"
  >{setiChar}</span>
{:else if useCodicon}
  <span class="codicon {codiconClass}" aria-hidden="true" style="font-size: {size}px; width: {size + 2}px;"></span>
{:else if src}
  <img
    class="file-icon-img"
    {src}
    alt=""
    width={size}
    height={size}
    loading="lazy"
    onerror={onImgError}
  />
{/if}

<style>
  .seti-file-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: "seti", sans-serif;
    font-style: normal;
    font-weight: normal;
    /* Match VS Code Seti pack (manifest fonts.size = 150%). */
    font-size: calc(var(--seti-size, 16px) * 1.5);
    line-height: 1;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .file-icon-img {
    flex-shrink: 0;
    object-fit: contain;
    display: block;
  }
</style>
