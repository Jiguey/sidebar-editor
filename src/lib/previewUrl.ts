/** Allowed hosts for in-app preview iframe (local dev servers only). */

const LOCAL_PREVIEW_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * True for http(s) URLs targeting localhost or 127.0.0.1 (any port/path).
 */
export function isLocalPreviewUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return LOCAL_PREVIEW_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}
