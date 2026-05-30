import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePhosphorOptimize } from "phosphor-svelte/vite";

const devPort = Number(process.env.VITE_PORT ?? process.env.PORT ?? 14200);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const deepseekApiKey =
    env.DEEPSEEK_API_KEY ?? env.deepseek_api_key ?? env.VITE_DEEPSEEK_API_KEY ?? "";
  const anthropicApiKey =
    env.ANTHROPIC_API_KEY ?? env.anthropic_api_key ?? env.VITE_ANTHROPIC_API_KEY ?? "";

  return {
  /** VS Code icon pack and other shipped static assets (`static/icon-packs/…`). */
  publicDir: path.resolve(import.meta.dirname, "static"),
  /** Svelte must run before `@tailwindcss/vite` so `.svelte` files are not parsed as raw CSS (fixes "Invalid declaration: onMount"). */
  plugins: [svelte(), sveltePhosphorOptimize(), tailwindcss()],
  define: {
    __TINYLLAMA_ENV_DEEPSEEK_API_KEY__: JSON.stringify(deepseekApiKey),
    __TINYLLAMA_ENV_ANTHROPIC_API_KEY__: JSON.stringify(anthropicApiKey),
  },
  clearScreen: false,
  resolve: {
    alias: {
      $lib: path.resolve(import.meta.dirname, "./src/lib"),
    },
  },
  server: {
    port: devPort,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        settings: path.resolve(import.meta.dirname, "settings.html"),
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@codemirror") || id.includes("codemirror")) return "codemirror";
          if (id.includes("@xterm") || id.includes("xterm")) return "xterm";
          if (id.includes("@tauri-apps")) return "tauri";
        },
      },
    },
  },
};
});
