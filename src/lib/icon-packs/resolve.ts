import type { VscodeIconManifest } from "./types";

function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/** Resolve manifest icon id for a file or folder name. */
export function resolveIconId(
  manifest: VscodeIconManifest,
  fileName: string,
  isDir: boolean,
  expanded = false
): string {
  const lower = fileName.toLowerCase();

  if (isDir) {
    if (expanded) {
      return manifest.folderNamesExpanded[lower] ?? manifest.folderNames[lower] ?? manifest.folderExpanded;
    }
    return manifest.folderNames[lower] ?? manifest.folder;
  }

  return (
    manifest.fileNames[lower] ??
    manifest.fileNames[fileName] ??
    manifest.fileExtensions[lower] ??
    manifest.fileExtensions[fileExtension(fileName)] ??
    manifest.file
  );
}

export function iconPathFromId(manifest: VscodeIconManifest, iconId: string): string | null {
  const def = manifest.iconDefinitions[iconId];
  if (!def?.iconPath) return null;
  return def.iconPath.replace(/^\.\//, "");
}

export function resolveIconRelativePath(
  manifest: VscodeIconManifest,
  fileName: string,
  isDir: boolean,
  expanded = false
): string | null {
  const id = resolveIconId(manifest, fileName, isDir, expanded);
  return iconPathFromId(manifest, id);
}
