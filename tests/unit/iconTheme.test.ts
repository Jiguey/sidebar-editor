import { describe, it, expect, beforeEach, vi } from "vitest";

describe("iconTheme storage migration", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    vi.resetModules();
    for (const k of Object.keys(store)) delete store[k];
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });

  it("migrates legacy vscode-icons preference to seti", async () => {
    store["tinyllama.iconTheme.v1"] = JSON.stringify({
      themeId: "vscode-icons",
      customPackPath: null,
      revision: 3,
    });

    const { iconTheme } = await import("../../src/lib/stores/iconTheme");
    expect(iconTheme.get().themeId).toBe("seti");
    expect(store["tinyllama.iconTheme.v2"]).toBeTruthy();
    expect(store["tinyllama.iconTheme.v1"]).toBeUndefined();
  });

  it("keeps legacy codicons preference", async () => {
    store["tinyllama.iconTheme.v1"] = JSON.stringify({
      themeId: "codicons",
      customPackPath: null,
      revision: 0,
    });

    const { iconTheme } = await import("../../src/lib/stores/iconTheme");
    expect(iconTheme.get().themeId).toBe("codicons");
  });
});
