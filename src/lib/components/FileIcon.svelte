<script lang="ts">
  import { iconTheme } from "$lib/stores/iconTheme";
  import { resolveIconRelativePath } from "$lib/icon-packs/resolve";

  interface Props {
    name: string;
    isDir?: boolean;
    expanded?: boolean;
    size?: number;
  }

  let { name, isDir = false, expanded = false, size = 16 }: Props = $props();

  let src = $state<string | null>(null);
  let useCodicon = $state(true);
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

  function applyCodiconFallback() {
    useCodicon = true;
    src = null;
    codiconClass = codiconFor(name, isDir, expanded);
  }

  function onImgError() {
    applyCodiconFallback();
  }

  $effect(() => {
    const theme = $iconTheme;
    void theme.revision;
    void theme.themeId;
    void name;
    void isDir;
    void expanded;

    applyCodiconFallback();

    let cancelled = false;

    void (async () => {
      if (theme.themeId === "codicons") return;

      try {
        const manifest = await iconTheme.ensureManifest();
        if (cancelled) return;
        if (!manifest) return;

        const rel = resolveIconRelativePath(manifest, name, isDir, expanded);
        if (!rel) return;

        const url = await iconTheme.iconUrl(rel);
        if (cancelled) return;

        useCodicon = false;
        src = url;
      } catch {
        if (!cancelled) applyCodiconFallback();
      }
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

{#if useCodicon}
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
  .file-icon-img {
    flex-shrink: 0;
    object-fit: contain;
    display: block;
  }
</style>
