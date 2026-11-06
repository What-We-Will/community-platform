// Shared harness for the classify-dependabot-pr.sh test files. The script is
// bash, so it is exercised as a subprocess rather than imported.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dirname, "classify-dependabot-pr.sh");

export type ClassifyInput = {
  updateType?: string;
  dependencyType?: string;
  dependencyNames?: string;
  packageEcosystem?: string;
};

export type ClassifyResult = {
  verdict?: string;
  reason?: string;
  isUiSurface?: string;
  workflowCommands: string[];
  outputDelimiter?: string;
  stopCommandsToken?: string;
};

export function classify({
  updateType = "version-update:semver-patch",
  dependencyType = "direct:production",
  dependencyNames = "left-pad",
  packageEcosystem = "npm",
}: ClassifyInput = {}): ClassifyResult {
  const dir = mkdtempSync(join(tmpdir(), "classify-"));
  const outputPath = join(dir, "github-output");

  try {
    const stdout = execFileSync("bash", [SCRIPT], {
      env: {
        ...process.env,
        UPDATE_TYPE: updateType,
        DEPENDENCY_TYPE: dependencyType,
        DEPENDENCY_NAMES: dependencyNames,
        PACKAGE_ECOSYSTEM: packageEcosystem,
        GITHUB_OUTPUT: outputPath,
      },
      encoding: "utf8",
    });

    const raw = readFileSync(outputPath, "utf8");
    const outputs = parseGithubOutput(raw);

    return {
      verdict: outputs.get("verdict"),
      isUiSurface: outputs.get("is-ui-surface"),
      reason: outputs.get("reason"),
      workflowCommands: activeWorkflowCommands(stdout),
      outputDelimiter: raw.match(/^reason<<(.*)$/m)?.[1],
      stopCommandsToken: stdout.match(/^::stop-commands::(.*)$/m)?.[1],
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Mirrors the Actions runner's file-command parser, including last-write-wins on
// a repeated key, so an output smuggled past a heredoc delimiter shows up here
// the way it would in a real run.
function parseGithubOutput(raw: string): Map<string, string> {
  const outputs = new Map<string, string>();
  const lines = raw.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "") continue;

    const eq = line.indexOf("=");
    const heredoc = line.indexOf("<<");

    if (eq >= 0 && (heredoc < 0 || eq < heredoc)) {
      outputs.set(line.slice(0, eq), line.slice(eq + 1));
      continue;
    }
    if (heredoc < 0) throw new Error(`Invalid GITHUB_OUTPUT line: ${line}`);

    const key = line.slice(0, heredoc);
    const delimiter = line.slice(heredoc + 2);
    const end = lines.indexOf(delimiter, i + 1);
    if (end < 0) throw new Error(`No closing delimiter for ${key}`);

    outputs.set(key, lines.slice(i + 1, end).join("\n"));
    i = end;
  }

  return outputs;
}

// The `::name::value` lines the runner would act on, skipping any block between
// `::stop-commands::<token>` and `::<token>::`.
function activeWorkflowCommands(stdout: string): string[] {
  const commands: string[] = [];
  let resumeToken: string | undefined;

  for (const raw of stdout.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("::")) continue;

    if (resumeToken !== undefined) {
      if (line === `::${resumeToken}::`) resumeToken = undefined;
      continue;
    }

    const stop = line.match(/^::stop-commands::(.+)$/);
    if (stop) resumeToken = stop[1];
    else commands.push(line);
  }

  return commands;
}
