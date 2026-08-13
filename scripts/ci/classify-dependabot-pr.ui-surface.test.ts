// @vitest-environment node
import { classify } from "./classify-dependabot-pr.harness";

describe("Dependabot triage — UI-surface packages", () => {
  it.each([
    "tailwindcss",
    "tailwind-merge",
    "tw-animate-css",
    "@tailwindcss/postcss",
    "radix-ui",
    "@dnd-kit/core",
  ])("should require review when a patch bump touches %s", (dependencyNames) => {
    const updateType = "version-update:semver-patch";

    const { verdict, reason } = classify({ updateType, dependencyNames });

    expect(verdict).toBe("needs-review");
    expect(reason).toContain("UI-surface");
  });

  it("should require review when a minor bump touches a UI-surface package", () => {
    const updateType = "version-update:semver-minor";

    const { verdict, reason } = classify({ updateType, dependencyNames: "tailwindcss" });

    expect(verdict).toBe("needs-review");
    expect(reason).toContain("UI-surface");
  });

  it("should name the bump level when a UI-surface package is flagged", () => {
    const dependencyNames = "radix-ui";

    const patch = classify({ updateType: "version-update:semver-patch", dependencyNames });
    const minor = classify({ updateType: "version-update:semver-minor", dependencyNames });

    expect(patch.reason).toContain("patch bump");
    expect(minor.reason).toContain("minor bump");
  });

  it("should require review when a UI-surface package appears among several names", () => {
    const dependencyNames = "left-pad, tailwindcss, semver";

    const { verdict } = classify({ updateType: "version-update:semver-patch", dependencyNames });

    expect(verdict).toBe("needs-review");
  });

  it("should require review when the UI-surface package is a dev dependency", () => {
    const dependencyType = "direct:development";

    const { verdict } = classify({
      updateType: "version-update:semver-patch",
      dependencyNames: "tailwindcss",
      dependencyType,
    });

    expect(verdict).toBe("needs-review");
  });
});

describe("Dependabot triage — is-ui-surface output", () => {
  it("should report true when the bump touches a UI-surface package", () => {
    const dependencyNames = "radix-ui";

    const { isUiSurface } = classify({ dependencyNames });

    expect(isUiSurface).toBe("true");
  });

  it("should report false when the bump touches no UI-surface package", () => {
    const dependencyNames = "left-pad";

    const { isUiSurface } = classify({ dependencyNames });

    expect(isUiSurface).toBe("false");
  });

  it("should report true when a major bump touches a UI-surface package", () => {
    const updateType = "version-update:semver-major";

    const { verdict, isUiSurface } = classify({ updateType, dependencyNames: "radix-ui" });

    expect(verdict).toBe("needs-review");
    expect(isUiSurface).toBe("true");
  });
});
