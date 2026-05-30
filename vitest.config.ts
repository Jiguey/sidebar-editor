import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const env = loadEnv("", process.cwd(), "");
for (const [k, v] of Object.entries(env)) {
  if (v && process.env[k] === undefined) process.env[k] = v;
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, "./src/lib"),
    },
  },
});
