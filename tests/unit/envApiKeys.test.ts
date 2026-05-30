import { describe, expect, it, vi, afterEach } from "vitest";
import { deepseekApiKeyFromProcessEnv } from "../../src/lib/envApiKeys";

describe("envApiKeys", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("reads deepseek key from process env aliases", () => {
    process.env = { ...env, deepseek_api_key: "sk-from-env" };
    expect(deepseekApiKeyFromProcessEnv()).toBe("sk-from-env");
  });
});
