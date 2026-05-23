function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
}

export function isAbsolutePath(filePath: string): boolean {
  return filePath.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(filePath);
}

export function joinPath(base: string, relative: string): string {
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedRelative = relative.replace(/^\.\//, "");
  return `${normalizedBase}/${normalizedRelative}`;
}

export function resolvePath(workspacePath: string, filePath: string): string {
  if (isAbsolutePath(filePath)) {
    return filePath;
  }
  return joinPath(workspacePath, filePath);
}

export function assertWithinWorkspace(workspacePath: string, resolvedPath: string): void {
  const root = normalizePath(workspacePath);
  const target = normalizePath(resolvedPath);
  if (target === root) return;
  if (!target.startsWith(`${root}/`)) {
    throw new Error(`Path is outside the workspace: ${resolvedPath}`);
  }
}

export function resolveWorkspacePath(
  workspacePath: string,
  filePath: string,
  options?: { allowWorkspaceRoot?: boolean }
): string {
  const resolved = resolvePath(workspacePath, filePath);
  if (!options?.allowWorkspaceRoot) {
    assertWithinWorkspace(workspacePath, resolved);
  } else {
    const root = normalizePath(workspacePath);
    const target = normalizePath(resolved);
    if (target !== root && !target.startsWith(`${root}/`)) {
      throw new Error(`Path is outside the workspace: ${resolved}`);
    }
  }
  return resolved;
}
