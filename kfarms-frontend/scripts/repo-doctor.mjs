import { execSync } from "node:child_process";
import path from "node:path";

function normalizePath(value) {
  return path.resolve(String(value || "")).replace(/[\\/]+$/, "");
}

const cwd = normalizePath(process.cwd());
let gitTopLevel = "";

try {
  gitTopLevel = normalizePath(
    execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim(),
  );
} catch {
  console.log("repo:doctor -> no git repository detected in this folder.");
  process.exit(0);
}

if (gitTopLevel !== cwd) {
  console.log("repo:doctor -> warning: project is nested inside another git repository.");
  console.log(`cwd:        ${cwd}`);
  console.log(`git root:   ${gitTopLevel}`);
  console.log("suggestion: isolate this app into its own git repo before release work.");
  process.exit(0);
}

console.log("repo:doctor -> git root is correctly scoped to this project.");

