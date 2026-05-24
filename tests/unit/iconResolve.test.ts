import { describe, it, expect } from "vitest";
import { resolveIconId, resolveIconRelativePath } from "../../src/lib/icon-packs/resolve";
import type { VscodeIconManifest } from "../../src/lib/icon-packs/types";

const miniManifest: VscodeIconManifest = {
  iconDefinitions: {
    _file: { iconPath: "./icons/file.svg" },
    _folder: { iconPath: "./icons/folder.svg" },
    _folder_open: { iconPath: "./icons/folder_open.svg" },
    _f_typescript: { iconPath: "./icons/typescript.svg" },
    _fd_folder_src: { iconPath: "./icons/folder_src.svg" },
  },
  file: "_file",
  folder: "_folder",
  folderExpanded: "_folder_open",
  fileExtensions: { ts: "_f_typescript" },
  fileNames: { "package.json": "_f_npm" },
  folderNames: { src: "_fd_folder_src" },
  folderNamesExpanded: { src: "_fd_folder_src_open" },
};

describe("icon resolve", () => {
  it("resolves extension and file name", () => {
    expect(resolveIconId(miniManifest, "app.ts", false)).toBe("_f_typescript");
    expect(resolveIconRelativePath(miniManifest, "app.ts", false)).toBe("icons/typescript.svg");
  });

  it("resolves folder names", () => {
    expect(resolveIconId(miniManifest, "src", true, false)).toBe("_fd_folder_src");
    expect(resolveIconId(miniManifest, "other", true, false)).toBe("_folder");
    expect(resolveIconId(miniManifest, "other", true, true)).toBe("_folder_open");
  });
});
