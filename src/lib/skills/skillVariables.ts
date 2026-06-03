/**
 * Skill variable interpolation (spec 30 §10).
 *
 * Skills use `{{double_brace}}` tokens. Known variables are replaced with their
 * value (or empty string if the value is null/unavailable). Unknown variables
 * are left **literal** so authoring errors surface to the model (§10.3).
 */

export interface VariableContext {
  workspacePath: string | null;
  /** Relative path of the focused editor tab. */
  activeFilePath: string | null;
  /** Full contents of the focused editor tab (expensive — opt in). */
  activeFileContents: string | null;
  /** Relative paths of open editor tabs. */
  openFilePaths: string[];
  gitBranch: string | null;
  /** Pre-built filtered workspace tree (computed once per assembly). */
  fileTree: string | null;
  today: string;
  /** Auto-detected stack label, e.g. "Node.js / React / TypeScript". */
  projectType: string | null;
}

function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

/** The set of recognised variable names (spec 30 §10.1). */
export const KNOWN_SKILL_VARIABLES = [
  "workspace_name",
  "workspace_path",
  "active_file",
  "active_file_contents",
  "git_branch",
  "open_files",
  "file_tree",
  "today",
  "project_type",
] as const;

export type SkillVariableName = (typeof KNOWN_SKILL_VARIABLES)[number];

function resolveVariable(name: string, ctx: VariableContext): string | undefined {
  switch (name) {
    case "workspace_name":
      return ctx.workspacePath ? basename(ctx.workspacePath) : "";
    case "workspace_path":
      return ctx.workspacePath ?? "";
    case "active_file":
      return ctx.activeFilePath ?? "";
    case "active_file_contents":
      return ctx.activeFileContents ?? "";
    case "git_branch":
      return ctx.gitBranch ?? "";
    case "open_files":
      return ctx.openFilePaths.join(", ");
    case "file_tree":
      return ctx.fileTree ?? "";
    case "today":
      return ctx.today;
    case "project_type":
      return ctx.projectType ?? "";
    default:
      return undefined; // unknown — leave literal
  }
}

/**
 * Replace `{{variable}}` tokens in `content`. Known variables get their value;
 * unknown variables are left exactly as written.
 */
export function interpolateSkill(content: string, ctx: VariableContext): string {
  return content.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, name: string) => {
    const value = resolveVariable(name, ctx);
    return value === undefined ? match : value;
  });
}

/** Returns true if `content` uses the (expensive) `{{active_file_contents}}` variable. */
export function usesExpensiveVariable(content: string): boolean {
  return /\{\{\s*active_file_contents\s*\}\}/.test(content);
}

/** Default empty context (everything unavailable). */
export function emptyVariableContext(): VariableContext {
  return {
    workspacePath: null,
    activeFilePath: null,
    activeFileContents: null,
    openFilePaths: [],
    gitBranch: null,
    fileTree: null,
    today: new Date().toISOString().slice(0, 10),
    projectType: null,
  };
}
