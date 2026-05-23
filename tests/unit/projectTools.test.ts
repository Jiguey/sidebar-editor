import { describe, it, expect } from "vitest";
import { mergeProjectToolsLayer } from "../../src/lib/projectTools";
import { DEFAULT_TOOL_POLICY } from "../../src/lib/toolPolicy";
import { EMPTY_PARAMETERS_JSON } from "../../src/lib/toolSchema";

describe("projectTools", () => {
  it("mergeProjectToolsLayer applies project tool rules and custom tools", () => {
    const merged = mergeProjectToolsLayer(DEFAULT_TOOL_POLICY, {
      toolRules: { grep: "deny", run_shell: "allow" },
      customTools: [
        {
          name: "deploy",
          description: "Deploy staging",
          rule: "ask",
          parametersJson: EMPTY_PARAMETERS_JSON,
        },
      ],
    });

    expect(merged.toolRules.grep).toBe("deny");
    expect(merged.toolRules.run_shell).toBe("allow");
    expect(merged.customTools.some((t) => t.name === "deploy")).toBe(true);
  });

  it("mergeProjectToolsLayer returns global when project is null", () => {
    expect(mergeProjectToolsLayer(DEFAULT_TOOL_POLICY, null)).toBe(DEFAULT_TOOL_POLICY);
  });
});
