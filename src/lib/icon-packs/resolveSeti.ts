import type { SetiIconDefinition, SetiIconManifest } from "./setiTypes";
import { setiLanguageIdFromFileName } from "./setiLanguage";

function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/** Map Seti `\\E099` private-use escape to a Unicode character (VS Code / Cursor format). */
export function setiFontCharacterToChar(fontCharacter: string): string {
  const hex = fontCharacter.trim().replace(/^\\E/i, "E");
  const cp = parseInt(hex, 16);
  if (Number.isNaN(cp)) return "";
  return String.fromCodePoint(cp);
}

export function resolveSetiIconId(
  manifest: SetiIconManifest,
  fileName: string,
  isDir: boolean,
  expanded = false
): string {
  const lower = fileName.toLowerCase();

  if (isDir) {
    if (expanded && manifest.folderNamesExpanded?.[lower]) {
      return manifest.folderNamesExpanded[lower];
    }
    if (manifest.folderNames?.[lower]) return manifest.folderNames[lower];
    return expanded
      ? (manifest.folderExpanded ?? manifest.folder ?? "_folder_open")
      : (manifest.folder ?? "_folder");
  }

  const ext = fileExtension(fileName);

  if (manifest.fileNames[lower]) return manifest.fileNames[lower];
  if (manifest.fileNames[fileName]) return manifest.fileNames[fileName];
  if (ext && manifest.fileExtensions[ext]) return manifest.fileExtensions[ext];

  const languageId = setiLanguageIdFromFileName(fileName);
  if (languageId && manifest.languageIds?.[languageId]) {
    return manifest.languageIds[languageId];
  }

  return manifest.file;
}

export function resolveSetiIcon(
  manifest: SetiIconManifest,
  fileName: string,
  isDir: boolean,
  expanded = false
): SetiIconDefinition | null {
  const id = resolveSetiIconId(manifest, fileName, isDir, expanded);
  return manifest.iconDefinitions[id] ?? manifest.iconDefinitions[manifest.file] ?? null;
}
