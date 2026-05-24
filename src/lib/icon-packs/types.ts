/** VS Code icon theme manifest (icons.json). */
export type VscodeIconManifest = {
  hidesExplorerArrows?: boolean;
  iconDefinitions: Record<string, { iconPath: string }>;
  file: string;
  folder: string;
  folderExpanded: string;
  rootFolder?: string;
  rootFolderExpanded?: string;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
};

export type IconThemeId = "seti" | "vscode-icons" | "codicons" | "custom";

export const SETI_ICONS_ATTRIBUTION = {
  name: "Seti UI",
  author: "Jesse Weed",
  repository: "https://github.com/jesseweed/seti-ui",
  license: "MIT",
};

export const VSCODE_ICONS_ATTRIBUTION = {
  name: "Icons – Maintained (vscode-icons)",
  author: "Yusif Aliyev",
  repository: "https://github.com/yusifaliyevpro/vscode-icons",
  license: "MIT",
  copyright:
    "Copyright (c) 2022 Mhammed Talhaouy (tal7aouy); Copyright (c) 2026 Yusif Aliyev (yusifaliyevpro)",
};
