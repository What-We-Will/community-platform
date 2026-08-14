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
    execFileSync("bash", [SCRIPT], {
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

    return {
      verdict: raw.match(/^verdict=(.*)$/m)?.[1],
      isUiSurface: raw.match(/^is-ui-surface=(.*)$/m)?.[1],
      reason: raw.match(/reason<<EOF_REASON\n([\s\S]*?)\nEOF_REASON/)?.[1],
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
