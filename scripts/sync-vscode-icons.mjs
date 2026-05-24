#!/usr/bin/env node
/**
 * Downloads the vscode-icons VSIX from the Visual Studio Marketplace and extracts
 * manifest.json + icons/ into static/icon-packs/vscode-icons/
 *
 * Source: https://github.com/yusifaliyevpro/vscode-icons
 */
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VSIX_URL =
  "https://marketplace.visualstudio.com/_apis/public/gallery/publishers/yusifaliyevpro/vsextensions/vscicons/1.1.4/vspackage";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "static/icon-packs/vscode-icons");
const work = path.join(root, ".tmp-vscicons-sync");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: root });
}

function main() {
  if (existsSync(work)) rmSync(work, { recursive: true });
  mkdirSync(work, { recursive: true });

  const gz = path.join(work, "pack.gz");
  const vsix = path.join(work, "pack.vsix");
  const extract = path.join(work, "unzipped");

  console.log("Downloading vscode-icons VSIX…");
  run(`curl -sL "${VSIX_URL}" -o "${gz}"`);
  run(`gunzip -c "${gz}" > "${vsix}"`);
  mkdirSync(extract, { recursive: true });
  console.log("Extracting…");
  run(`unzip -qo "${vsix}" "extension/icons.json" "extension/icons/*" -d "${extract}"`);

  if (existsSync(dest)) rmSync(dest, { recursive: true });
  mkdirSync(dest, { recursive: true });
  cpSync(path.join(extract, "extension/icons.json"), path.join(dest, "manifest.json"));
  cpSync(path.join(extract, "extension/icons"), path.join(dest, "icons"), { recursive: true });

  rmSync(work, { recursive: true });
  console.log(`Done. Icon pack at ${dest}`);
}

main();
