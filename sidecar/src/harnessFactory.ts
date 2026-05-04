import type { Harness } from "./harness.js";
import { PiAdapter } from "./adapters/pi.js";
import { MinimalPiAdapter } from "./adapters/minimalPi.js";

/** Values the UI may send; unknown ids fall back to Pi (latest SDK). */
export type HarnessKind = "pi-latest" | "pi-minimal";

export function normalizeHarnessKind(kind: string | undefined): HarnessKind {
  if (kind === "pi-minimal") return "pi-minimal";
  if (kind === "pi" || kind === "pi-builtin" || kind === "pi-latest" || !kind) return "pi-latest";
  return "pi-latest";
}

export function createHarness(kind: HarnessKind): Harness {
  switch (kind) {
    case "pi-minimal":
      return new MinimalPiAdapter();
    case "pi-latest":
    default:
      return new PiAdapter();
  }
}
