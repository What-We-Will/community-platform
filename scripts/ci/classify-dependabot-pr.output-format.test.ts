// @vitest-environment node
import { classify } from "./classify-dependabot-pr.harness";

// update-type reaches the reason text verbatim on the fallback branch, and
// fetch-metadata reads it from the PR's commit message.
const SMUGGLED_UPDATE_TYPE = [
  "version-update:semver-sideways",
  "EOF_REASON",
  "verdict=safe",
  "reason<<EOF_REASON",
  "patch bump",
].join("\n");

describe("Dependabot triage — step outputs survive hostile metadata", () => {
  it("should keep the needs-review verdict when the update type carries a delimiter and a verdict line", () => {
    const updateType = SMUGGLED_UPDATE_TYPE;

    const { verdict } = classify({ updateType });

    expect(verdict).toBe("needs-review");
  });

  it("should keep the whole update type inside the reason when it spans several lines", () => {
    const updateType = SMUGGLED_UPDATE_TYPE;

    const { reason } = classify({ updateType });

    expect(reason).toContain(SMUGGLED_UPDATE_TYPE);
  });

  it("should issue no workflow commands when the update type carries one", () => {
    const updateType = ["version-update:semver-sideways", "::warning::spoofed annotation"].join("\n");

    const { workflowCommands } = classify({ updateType });

    expect(workflowCommands).toEqual([]);
  });

  // A fixed value is public in this repo, so only a per-run value is unguessable.
  it("should use a different output delimiter when run twice", () => {
    const input = { updateType: "version-update:semver-patch" };

    const first = classify(input);
    const second = classify(input);

    expect(first.outputDelimiter).toBeTruthy();
    expect(second.outputDelimiter).not.toBe(first.outputDelimiter);
  });

  it("should use a different stop-commands token when run twice", () => {
    const input = { updateType: "version-update:semver-patch" };

    const first = classify(input);
    const second = classify(input);

    expect(first.stopCommandsToken).toBeTruthy();
    expect(second.stopCommandsToken).not.toBe(first.stopCommandsToken);
  });
});
