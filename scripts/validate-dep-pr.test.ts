// @vitest-environment node
import { runValidateDepPr } from "./validate-dep-pr.harness";

describe("validate-dep-pr — worktree retention", () => {
  it("should remove the worktree when the run succeeds without --keep", () => {
    const { exitCode, worktreePath, worktreeExists } = runValidateDepPr();

    expect(exitCode).toBe(0);
    expect(worktreePath).toBeDefined();
    expect(worktreeExists).toBe(false);
  });

  it("should retain the worktree when --keep is passed", () => {
    const { exitCode, worktreeExists } = runValidateDepPr({ args: ["--keep", "main"] });

    expect(exitCode).toBe(0);
    expect(worktreeExists).toBe(true);
  });

  it("should accept --keep after the positional argument", () => {
    const { exitCode, worktreeExists } = runValidateDepPr({ args: ["main", "--keep"] });

    expect(exitCode).toBe(0);
    expect(worktreeExists).toBe(true);
  });

  it("should print the retained path and its cleanup command when --keep is passed", () => {
    const { output, worktreePath } = runValidateDepPr({ args: ["--keep", "main"] });

    expect(output).toContain(`worktree retained at ${worktreePath}`);
    expect(output).toContain(`git worktree remove --force ${worktreePath}`);
  });

  it("should remove the worktree when a check fails without --keep", () => {
    const { exitCode, worktreeExists } = runValidateDepPr({ npmExitCode: 1 });

    expect(exitCode).not.toBe(0);
    expect(worktreeExists).toBe(false);
  });

  it("should retain the worktree when a check fails with --keep", () => {
    const { exitCode, worktreeExists } = runValidateDepPr({
      args: ["--keep", "main"],
      npmExitCode: 1,
    });

    expect(exitCode).not.toBe(0);
    expect(worktreeExists).toBe(true);
  });
});

describe("validate-dep-pr — argument handling", () => {
  it("should exit 2 when no positional argument is given", () => {
    const { exitCode, output } = runValidateDepPr({ args: [] });

    expect(exitCode).toBe(2);
    expect(output).toContain("usage:");
  });

  it("should exit 2 when --keep is the only argument", () => {
    const { exitCode, output } = runValidateDepPr({ args: ["--keep"] });

    expect(exitCode).toBe(2);
    expect(output).toContain("usage:");
  });

  it("should exit 2 when more than one positional argument is given", () => {
    const { exitCode, output } = runValidateDepPr({ args: ["main", "other"] });

    expect(exitCode).toBe(2);
    expect(output).toContain("usage:");
  });

  it("should exit 2 and name the offending flag when an unknown option is given", () => {
    const { exitCode, output } = runValidateDepPr({ args: ["--nope", "main"] });

    expect(exitCode).toBe(2);
    expect(output).toContain("unknown option '--nope'");
  });

  it("should not create a worktree when argument parsing fails", () => {
    const { worktreePath } = runValidateDepPr({ args: [] });

    expect(worktreePath).toBeUndefined();
  });
});
