// Shared harness for the validate-dep-pr.sh test file. The script is bash, so it is
// exercised as a subprocess rather than imported.
//
// It runs against a throwaway repo with a real `origin`, because the behaviour under
// test is git worktree lifecycle. npm is stubbed on PATH: the install/lint/build steps
// are not what these tests are about, and running them for real would take minutes.
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dirname, "validate-dep-pr.sh");

export type RunOptions = {
  args?: string[];
  npmExitCode?: number;
};

export type RunResult = {
  exitCode: number;
  output: string;
  worktreePath?: string;
  worktreeExists: boolean;
};

const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" });

function makeOriginRepo(root: string): string {
  const origin = join(root, "origin");

  mkdirSync(origin);
  git(origin, "init", "--quiet", "--initial-branch", "main");
  git(origin, "config", "user.email", "test@example.com");
  git(origin, "config", "user.name", "Test");
  writeFileSync(join(origin, "package.json"), '{"name":"fixture"}\n');
  git(origin, "add", ".");
  git(origin, "commit", "--quiet", "-m", "fixture");

  return origin;
}

function makeStubBin(root: string, npmExitCode: number): string {
  const bin = join(root, "bin");

  mkdirSync(bin);
  for (const name of ["npm", "npx"]) {
    const stub = join(bin, name);
    writeFileSync(stub, `#!/bin/sh\necho "stub ${name} $*"\nexit ${npmExitCode}\n`);
    chmodSync(stub, 0o755);
  }

  return bin;
}

export function runValidateDepPr({ args = ["main"], npmExitCode = 0 }: RunOptions = {}): RunResult {
  const root = mkdtempSync(join(tmpdir(), "validate-dep-pr-"));
  let retained: string | undefined;

  try {
    const origin = makeOriginRepo(root);
    const clone = join(root, "clone");
    execFileSync("git", ["clone", "--quiet", origin, clone], { stdio: "pipe" });
    mkdirSync(join(clone, "scripts"), { recursive: true });
    cpSync(SCRIPT, join(clone, "scripts", "validate-dep-pr.sh"));

    const bin = makeStubBin(root, npmExitCode);
    const result = spawnSync("bash", [join(clone, "scripts", "validate-dep-pr.sh"), ...args], {
      cwd: clone,
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const worktreePath = output.match(/checking out into (\S+)/)?.[1];
    retained = worktreePath;

    return {
      exitCode: result.status ?? -1,
      output,
      worktreePath,
      worktreeExists: worktreePath !== undefined && existsSync(worktreePath),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
    if (retained) rmSync(retained, { recursive: true, force: true });
  }
}
