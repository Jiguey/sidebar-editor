/** Resolved from the bundled `@mariozechner/pi-coding-agent` package when present. */
export async function readBundledPiSdkVersion(): Promise<string | undefined> {
  try {
    const mod = await import("@mariozechner/pi-coding-agent");
    const v = (mod as { VERSION?: string }).VERSION;
    return typeof v === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}
