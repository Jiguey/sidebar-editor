#!/usr/bin/env node
/**
 * Full dev: Vite (browser) + Tauri desktop window sharing one dev server.
 * Use `dev:web` for frontend-only or `dev:desktop` when Tauri should own the Vite process.
 */
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";

const port = Number(process.env.VITE_PORT ?? process.env.PORT ?? 14200);
const devUrl = `http://127.0.0.1:${port}`;

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
}

function waitForDevServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok || res.status === 404) {
          resolve();
          return;
        }
      } catch {
        /* not ready */
      }
      if (Date.now() >= deadline) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

execSync("node scripts/free-dev-port.mjs", { stdio: "inherit" });

const viteEnv = { ...process.env };
const vite = run("pnpm", ["exec", "vite"], { env: viteEnv });

const tauriEnv = { ...process.env };
if (process.platform === "linux") {
  tauriEnv.WEBKIT_DISABLE_COMPOSITING_MODE = "1";
}

let tauri = null;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (tauri && !tauri.killed) tauri.kill("SIGTERM");
  if (vite && !vite.killed) vite.kill("SIGTERM");
  setTimeout(() => process.exit(code), 100);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

vite.on("exit", (code, signal) => {
  if (shuttingDown) return;
  if (signal) shutdown(1);
  else shutdown(code ?? 1);
});

try {
  await waitForDevServer(devUrl);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  shutdown(1);
}

tauri = run("pnpm", [
  "exec",
  "tauri",
  "dev",
  "--config",
  JSON.stringify({ build: { beforeDevCommand: "" } }),
], { env: tauriEnv });

tauri.on("exit", (code, signal) => {
  if (shuttingDown) return;
  if (signal) shutdown(1);
  else shutdown(code ?? 1);
});
