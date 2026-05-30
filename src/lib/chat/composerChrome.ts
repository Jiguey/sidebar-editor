export type ComposerChromeState = "idle" | "focused" | "working";

export function resolveComposerChromeState(
  streaming: boolean,
  focused: boolean
): ComposerChromeState {
  if (streaming) return "working";
  if (focused) return "focused";
  return "idle";
}
