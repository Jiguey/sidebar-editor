import type { SetiIconManifest } from "./setiTypes";

const SETI_BASE = "/icon-packs/seti";
const SETI_MANIFEST_URL = `${SETI_BASE}/manifest.json`;

let cached: SetiIconManifest | null = null;

export function bundledSetiBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}${SETI_BASE}`;
}

export function bundledSetiFontUrl(): string {
  return `${bundledSetiBaseUrl()}/seti.woff`;
}

export async function loadBundledSetiManifest(): Promise<SetiIconManifest> {
  if (cached) return cached;
  const base = import.meta.env.BASE_URL ?? "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  const res = await fetch(`${root}${SETI_MANIFEST_URL}`);
  if (!res.ok) throw new Error(`Failed to load Seti manifest (${res.status})`);
  cached = (await res.json()) as SetiIconManifest;
  return cached;
}

export function clearSetiManifestCache(): void {
  cached = null;
}
