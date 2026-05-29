import { describe, expect, it } from "vitest";
import {
  STREAMING_STATUS_WORDS,
  pickStreamingStatusWord,
  stableStreamingStatusWord,
} from "../../src/lib/agent/streamingStatusWord";

describe("pickStreamingStatusWord", () => {
  it("returns a word from the list", () => {
    const word = pickStreamingStatusWord(() => 0);
    expect(STREAMING_STATUS_WORDS).toContain(word);
    expect(word).toBe(STREAMING_STATUS_WORDS[0]);
  });
});

describe("stableStreamingStatusWord", () => {
  it("is stable for the same seed", () => {
    expect(stableStreamingStatusWord("msg-abc")).toBe(stableStreamingStatusWord("msg-abc"));
    expect(STREAMING_STATUS_WORDS).toContain(stableStreamingStatusWord("msg-abc"));
  });
});
