import type { VscodeIconManifest } from "./types";

const BUNDLED_MANIFEST_URL = "/icon-packs/vscode-icons/manifest.json";
const BUNDLED_BASE_URL = "/icon-packs/vscode-icons";

let cachedManifest: VscodeIconManifest | null = null;

export function bundledIconPackBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}${BUNDLED_BASE_URL}`;
}

export function bundledManifestUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}${BUNDLED_MANIFEST_URL}`;
}

export async function loadBundledVscodeIconManifest(): Promise<VscodeIconManifest> {
  if (cachedManifest) return cachedManifest;
  const res = await fetch(bundledManifestUrl());
  if (!res.ok) {
    throw new Error(`Failed to load icon manifest (${res.status})`);
  }
  cachedManifest = (await res.json()) as VscodeIconManifest;
  return cachedManifest;
}

export function clearBundledManifestCache(): void {
  cachedManifest = null;
}
