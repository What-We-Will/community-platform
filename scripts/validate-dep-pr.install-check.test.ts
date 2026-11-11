// @vitest-environment node
import { runValidateDepPr } from "./validate-dep-pr.harness";

// `npm ci` trusts the lockfile and ignores unsatisfied optional peers; the deploy's
// `npm install` does not. The helper must fail on that gap the way CI's verify job does.
describe("validate-dep-pr — install resolution check", () => {
  it("should run the resolution check after npm ci and before lint", () => {
    const { exitCode, output } = runValidateDepPr();

    const ci = output.indexOf("stub npm ci");
    const resolution = output.indexOf("stub npm install --dry-run");
    const lint = output.indexOf("stub npm run lint");
    expect(exitCode).toBe(0);
    expect(ci).toBeGreaterThan(-1);
    expect(resolution).toBeGreaterThan(ci);
    expect(lint).toBeGreaterThan(resolution);
  });

  it("should fail without reporting success when npm ci passes but npm install cannot resolve", () => {
    const { exitCode, output } = runValidateDepPr({ failOnNpmSubcommand: "install" });

    expect(exitCode).not.toBe(0);
    expect(output).toContain("==> install check");
    expect(output).not.toContain("all checks passed");
    expect(output).not.toContain("stub npm run lint");
  });

  it("should remove the worktree when the resolution check fails without --keep", () => {
    const { worktreePath, worktreeExists } = runValidateDepPr({ failOnNpmSubcommand: "install" });

    expect(worktreePath).toBeDefined();
    expect(worktreeExists).toBe(false);
  });

  it("should retain the worktree when the resolution check fails with --keep", () => {
    const { worktreeExists } = runValidateDepPr({
      args: ["--keep", "main"],
      failOnNpmSubcommand: "install",
    });

    expect(worktreeExists).toBe(true);
  });
});
