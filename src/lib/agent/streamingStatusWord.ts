/** Whimsical status labels shown while waiting for the model (Claude-style). */
export const STREAMING_STATUS_WORDS = [
  "Combobulating",
  "Pondering",
  "Contemplating",
  "Elucidating",
  "Synthesizing",
  "Ruminating",
  "Percolating",
  "Cerebrating",
  "Cogitating",
  "Deliberating",
  "Musing",
  "Unfurling",
] as const;

export function pickStreamingStatusWord(random = Math.random): string {
  const i = Math.floor(random() * STREAMING_STATUS_WORDS.length);
  return STREAMING_STATUS_WORDS[i] ?? STREAMING_STATUS_WORDS[0];
}

/** Same whimsical label for a given turn id (archived blocks). */
export function stableStreamingStatusWord(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const i = Math.abs(h) % STREAMING_STATUS_WORDS.length;
  return STREAMING_STATUS_WORDS[i] ?? STREAMING_STATUS_WORDS[0];
}
