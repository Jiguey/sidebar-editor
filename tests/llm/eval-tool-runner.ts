import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { formatGitLog, formatGitStatus } from "../../src/lib/tools/gitFormat";
import { joinPath, resolveWorkspacePath } from "../../src/lib/tools/pathUtils";
import { unescapeLiteralEscapes } from "../../src/lib/textEscapes";

const execFileAsync = promisify(execFile);

export interface ToolResult {
  success: boolean;
  output: string;
}

export interface EvalToolContext {
  readFileMaxLines?: number;
  /** If set, write/create tools only allowed under this relative prefix (e.g. "plans"). */
  writePrefix?: string;
  toolTimeoutMs?: number;
}

function fail(message: string): ToolResult {
  return { success: false, output: message };
}

function ok(output: string): ToolResult {
  return { success: true, output };
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function requireString(args: Record<string, unknown>, key: string): string | ToolResult {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    return fail(`Missing required parameter: ${key}`);
  }
  return value;
}

function assertWriteAllowed(
  workspacePath: string,
  resolved: string,
  ctx?: EvalToolContext
): ToolResult | null {
  if (!ctx?.writePrefix) return null;
  const rel = path.relative(workspacePath, resolved).replace(/\\/g, "/");
  const prefix = ctx.writePrefix.replace(/\/+$/, "");
  if (rel === prefix || rel.startsWith(`${prefix}/`)) return null;
  return fail(`Write blocked: path must be under ${prefix}/ (plan mode)`);
}

async function readFileNode(resolved: string): Promise<string> {
  return fs.readFile(resolved, "utf8");
}

async function writeFileNode(resolved: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf8");
}

async function runReadFile(
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  const filePath = requireString(args, "path");
  if (typeof filePath !== "string") return filePath;
  const resolved = resolveWorkspacePath(workspacePath, filePath);
  const startLine =
    typeof args.start_line === "number" ? Math.max(1, Math.floor(args.start_line)) : 1;
  const maxLines = ctx?.readFileMaxLines ?? 500;
  const raw = await readFileNode(resolved);
  const lines = raw.split("\n");
  const slice = lines.slice(startLine - 1, startLine - 1 + maxLines);
  let output = slice.join("\n");
  if (startLine - 1 + maxLines < lines.length) {
    output += `\n\n[File truncated: showing lines ${startLine}–${startLine + slice.length - 1} of ${lines.length}.]`;
  }
  return ok(output);
}

async function runWriteFile(
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  const filePath = requireString(args, "path");
  if (typeof filePath !== "string") return filePath;
  if (args.content === undefined) return fail("Missing required parameter: content");
  const resolved = resolveWorkspacePath(workspacePath, filePath);
  const blocked = assertWriteAllowed(workspacePath, resolved, ctx);
  if (blocked) return blocked;
  await writeFileNode(resolved, String(args.content));
  return ok(`Successfully wrote to ${filePath}`);
}

async function runCreateFile(
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  const filePath = requireString(args, "path");
  if (typeof filePath !== "string") return filePath;
  if (args.content === undefined) return fail("Missing required parameter: content");
  const resolved = resolveWorkspacePath(workspacePath, filePath);
  const blocked = assertWriteAllowed(workspacePath, resolved, ctx);
  if (blocked) return blocked;
  if (await pathExists(resolved)) {
    return fail(`File already exists: ${filePath}. Use write_file to overwrite.`);
  }
  await writeFileNode(resolved, String(args.content));
  return ok(`Successfully created ${filePath}`);
}

async function runDeleteFile(
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  const filePath = requireString(args, "path");
  if (typeof filePath !== "string") return filePath;
  const resolved = resolveWorkspacePath(workspacePath, filePath);
  const blocked = assertWriteAllowed(workspacePath, resolved, ctx);
  if (blocked) return blocked;
  await fs.rm(resolved, { force: true });
  return ok(`Successfully deleted ${filePath}`);
}

async function runListDir(
  args: Record<string, unknown>,
  workspacePath: string
): Promise<ToolResult> {
  const dirPath = requireString(args, "path");
  if (typeof dirPath !== "string") return dirPath;
  const resolved = resolveWorkspacePath(workspacePath, dirPath, { allowWorkspaceRoot: true });
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const output = entries
    .map((e) => `${e.isDirectory() ? "[dir]" : "[file]"} ${e.name}`)
    .join("\n");
  return ok(output || "(empty directory)");
}

async function walkFiles(dir: string, max = 5000): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string) {
    if (out.length >= max) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === ".git") continue;
      const full = path.join(current, e.name);
      if (e.isDirectory()) await walk(full);
      else out.push(full);
      if (out.length >= max) return;
    }
  }
  await walk(dir);
  return out;
}

function globMatch(name: string, glob: string): boolean {
  const pattern = glob.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${pattern}$`, "i").test(name);
}

async function runFindFile(
  args: Record<string, unknown>,
  workspacePath: string
): Promise<ToolResult> {
  const glob = requireString(args, "glob");
  if (typeof glob !== "string") return glob;
  const maxResults = typeof args.max_results === "number" ? args.max_results : 100;
  const files = await walkFiles(workspacePath);
  const rel = files
    .map((f) => path.relative(workspacePath, f).replace(/\\/g, "/"))
    .filter((f) => globMatch(path.basename(f), glob) || globMatch(f, glob))
    .slice(0, maxResults);
  if (rel.length === 0) return ok("No files matched.");
  return ok(rel.join("\n"));
}

async function runGrep(
  args: Record<string, unknown>,
  workspacePath: string
): Promise<ToolResult> {
  const pattern = requireString(args, "pattern");
  if (typeof pattern !== "string") return pattern;
  const fileGlob = typeof args.file_glob === "string" ? args.file_glob : undefined;
  try {
    const rgArgs = ["--line-number", "--no-heading", pattern, workspacePath];
    if (fileGlob) rgArgs.splice(0, 0, "--glob", fileGlob);
    const { stdout } = await execFileAsync("rg", rgArgs, {
      maxBuffer: 5 * 1024 * 1024,
      cwd: workspacePath,
    });
    const lines = stdout.trim().split("\n").filter(Boolean);
    const rel = lines
      .map((line) => line.replace(`${workspacePath}/`, "").replace(`${workspacePath}\\`, ""))
      .slice(0, 100);
    return ok(rel.join("\n") || "No matches found.");
  } catch (e: unknown) {
    const err = e as { code?: number; stdout?: string };
    if (err.code === 1) return ok("No matches found.");
    /* fallback: simple scan */
    const re = new RegExp(pattern);
    const files = await walkFiles(workspacePath, 500);
    const matches: string[] = [];
    for (const file of files) {
      const base = path.basename(file);
      if (fileGlob && !globMatch(base, fileGlob)) continue;
      const content = await fs.readFile(file, "utf8");
      for (const [i, line] of content.split("\n").entries()) {
        if (re.test(line)) {
          matches.push(`${path.relative(workspacePath, file)}:${i + 1}: ${line}`);
          if (matches.length >= 100) break;
        }
      }
      if (matches.length >= 100) break;
    }
    return ok(matches.length ? matches.join("\n") : "No matches found.");
  }
}

async function buildTree(dir: string, depth: number, maxDepth: number): Promise<string> {
  if (depth > maxDepth) return "";
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const lines: string[] = [];
  const indent = "  ".repeat(depth);
  for (const e of entries) {
    if (e.name === ".git") continue;
    lines.push(`${indent}${e.isDirectory() ? "[dir]" : "[file]"} ${e.name}`);
    if (e.isDirectory() && depth < maxDepth) {
      lines.push(await buildTree(path.join(dir, e.name), depth + 1, maxDepth));
    }
  }
  return lines.filter(Boolean).join("\n");
}

async function runGetFileTree(
  args: Record<string, unknown>,
  workspacePath: string
): Promise<ToolResult> {
  const dirPath = requireString(args, "path");
  if (typeof dirPath !== "string") return dirPath;
  const maxDepth = typeof args.max_depth === "number" ? args.max_depth : 3;
  const resolved = resolveWorkspacePath(workspacePath, dirPath, { allowWorkspaceRoot: true });
  const tree = await buildTree(resolved, 0, maxDepth);
  return ok(tree || "(empty)");
}

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 5 * 1024 * 1024,
  });
  return stdout;
}

async function runGitStatus(workspacePath: string): Promise<ToolResult> {
  const out = await runGit(["status", "--porcelain"], workspacePath);
  const entries = out
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const code = line.slice(0, 2);
      const p = line.slice(3);
      const index = code[0] === "?" ? "??" : code[0] === " " ? "-" : code[0];
      const worktree = code[1] === "?" ? "??" : code[1] === " " ? "-" : code[1];
      return { path: p, index, worktree };
    });
  return ok(formatGitStatus(entries));
}

async function runGitLog(
  args: Record<string, unknown>,
  workspacePath: string
): Promise<ToolResult> {
  const limit = typeof args.limit === "number" ? args.limit : 32;
  const out = await runGit(
    ["log", `--max-count=${limit}`, "--format=%H|%s|%an|%ct"],
    workspacePath
  );
  const entries = out
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [oid, summary, author, timeStr] = line.split("|");
      return {
        oid: oid ?? "",
        summary: summary ?? "",
        author: author ?? "",
        time: Number.parseInt(timeStr ?? "0", 10) || 0,
      };
    });
  return ok(formatGitLog(entries));
}

async function runGitDiff(
  args: Record<string, unknown>,
  workspacePath: string
): Promise<ToolResult> {
  const filePath = typeof args.path === "string" ? args.path : undefined;
  const gitArgs = ["diff"];
  if (filePath) gitArgs.push("--", filePath);
  const out = await runGit(gitArgs, workspacePath);
  return ok(out.trim() || "(no diff)");
}

async function runShellCommand(
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  const command = requireString(args, "command");
  if (typeof command !== "string") return command;
  const timeoutMs = ctx?.toolTimeoutMs ?? (typeof args.timeout_ms === "number" ? args.timeout_ms : 30_000);
  try {
    const { stdout, stderr } = await execFileAsync("bash", ["-lc", command], {
      cwd: workspacePath,
      timeout: timeoutMs,
      maxBuffer: 5 * 1024 * 1024,
    });
    const output = [
      stdout ? `stdout:\n${unescapeLiteralEscapes(stdout)}` : "",
      stderr ? `stderr:\n${stderr}` : "",
      "exit code: 0",
    ]
      .filter(Boolean)
      .join("\n\n");
    return ok(output);
  } catch (e: unknown) {
    const err = e as { killed?: boolean; stdout?: string; stderr?: string; code?: number };
    if (err.killed) return fail(`Command timed out.\n${err.stderr ?? ""}`);
    const output = [
      err.stdout ? `stdout:\n${unescapeLiteralEscapes(err.stdout)}` : "",
      err.stderr ? `stderr:\n${err.stderr}` : "",
      `exit code: ${err.code ?? "unknown"}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    return { success: false, output };
  }
}

async function runTests(
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  const command =
    typeof args.command === "string" && args.command.trim() ? args.command.trim() : "echo 'no tests'";
  return runShellCommand({ command }, workspacePath, ctx);
}

type ToolHandler = (
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
) => Promise<ToolResult>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  read_file: runReadFile,
  write_file: runWriteFile,
  create_file: runCreateFile,
  delete_file: runDeleteFile,
  list_dir: runListDir,
  grep: runGrep,
  find_file: runFindFile,
  get_file_tree: runGetFileTree,
  get_git_status: (_args, wp) => runGitStatus(wp),
  get_git_log: runGitLog,
  get_git_diff: runGitDiff,
  run_shell: runShellCommand,
  run_tests: runTests,
  run_script: async (args, wp, ctx) => {
    const script = requireString(args, "script");
    if (typeof script !== "string") return script;
    const resolved = resolveWorkspacePath(wp, script);
    if (!(await pathExists(resolved))) return fail(`Script not found: ${script}`);
    return runShellCommand({ command: `bash "${resolved}"` }, wp, ctx);
  },
};

export async function executeEvalTool(
  name: string,
  args: Record<string, unknown>,
  workspacePath: string,
  ctx?: EvalToolContext
): Promise<ToolResult> {
  if (!workspacePath?.trim()) {
    return fail("No workspace folder is open.");
  }
  const handler = TOOL_HANDLERS[name];
  if (!handler) return fail(`Unknown tool: ${name}`);
  try {
    return await handler(args, workspacePath, ctx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(`Tool execution failed: ${msg}`);
  }
}

export { joinPath };
