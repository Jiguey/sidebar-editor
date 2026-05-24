/** VS Code Seti icon theme manifest (font glyphs, not SVG paths). */
export type SetiIconDefinition = {
  fontCharacter: string;
  fontColor: string;
};

export type SetiIconManifest = {
  iconDefinitions: Record<string, SetiIconDefinition>;
  file: string;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  /** VS Code language id → icon id (primary path for .ts, .rs, .py, etc.). */
  languageIds?: Record<string, string>;
  folderNames?: Record<string, string>;
  folderNamesExpanded?: Record<string, string>;
  folder?: string;
  folderExpanded?: string;
};
