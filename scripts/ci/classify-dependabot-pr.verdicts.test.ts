// @vitest-environment node
import { classify } from "./classify-dependabot-pr.harness";

describe("Dependabot triage — verdicts for non-UI packages", () => {
  it("should classify as safe when a patch bump touches a non-UI package", () => {
    const updateType = "version-update:semver-patch";

    const { verdict } = classify({ updateType });

    expect(verdict).toBe("safe");
  });

  it("should classify as safe when a minor bump touches a non-UI package", () => {
    const updateType = "version-update:semver-minor";

    const { verdict } = classify({ updateType });

    expect(verdict).toBe("safe");
  });

  it("should classify as safe when a minor bump touches a dev-only dependency", () => {
    const dependencyType = "direct:development";

    const { verdict, reason } = classify({
      updateType: "version-update:semver-minor",
      dependencyType,
    });

    expect(verdict).toBe("safe");
    expect(reason).toContain("dev-only");
  });

  it("should require review when the bump is a major version", () => {
    const updateType = "version-update:semver-major";

    const { verdict, reason } = classify({ updateType });

    expect(verdict).toBe("needs-review");
    expect(reason).toContain("major bump");
  });

  it("should require review when the ecosystem is github-actions", () => {
    const packageEcosystem = "github-actions";

    const { verdict, reason } = classify({
      packageEcosystem,
      updateType: "version-update:semver-patch",
    });

    expect(verdict).toBe("needs-review");
    expect(reason).toContain("github-actions");
  });

  it("should require review when the update type is unrecognized", () => {
    const updateType = "version-update:semver-sideways";

    const { verdict, reason } = classify({ updateType });

    expect(verdict).toBe("needs-review");
    expect(reason).toContain("unrecognized");
  });
});
