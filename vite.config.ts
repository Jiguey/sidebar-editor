import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const devPort = Number(process.env.VITE_PORT ?? process.env.PORT ?? 14200);

export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: devPort,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
