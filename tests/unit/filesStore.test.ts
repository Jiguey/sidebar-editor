import { describe, expect, it, beforeEach } from "vitest";
import { get } from "svelte/store";
import { files } from "../../src/lib/stores/files";

describe("files store setChildren", () => {
  beforeEach(() => {
    files.resetForTests();
  });

  it("preserves expanded nested state when refreshing a folder listing", () => {
    files.setTree([
      {
        name: "src",
        path: "/proj/src",
        is_dir: true,
        expanded: true,
        children: [
          {
            name: "lib",
            path: "/proj/src/lib",
            is_dir: true,
            expanded: true,
            children: [{ name: "a.ts", path: "/proj/src/lib/a.ts", is_dir: false }],
          },
        ],
      },
    ]);

    files.setChildren("/proj/src", [
      { name: "lib", path: "/proj/src/lib", is_dir: true },
      { name: "main.ts", path: "/proj/src/main.ts", is_dir: false },
    ]);

    const tree = get(files).tree;
    const src = tree[0];
    expect(src.children?.map((c) => c.name)).toEqual(["lib", "main.ts"]);
    const lib = src.children?.find((c) => c.name === "lib");
    expect(lib?.expanded).toBe(true);
    expect(lib?.children?.map((c) => c.name)).toEqual(["a.ts"]);
  });
});
