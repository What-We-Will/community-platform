/**
 * @vitest-environment node
 */
import { FEATURE_KEYS } from "@/lib/feature-keys";
import {
  FEATURE_DESCRIPTIONS,
  validateEnabledFeatures,
} from "./feature-preferences";

describe("validateEnabledFeatures — the vocabulary a member may submit", () => {
  it("should accept the full set when every supported key is submitted", () => {
    const input = [...FEATURE_KEYS];

    const result = validateEnabledFeatures(input);

    expect(result).toEqual({ ok: true, value: [...FEATURE_KEYS] });
  });

  it("should accept an empty selection when the member opts out of everything", () => {
    const result = validateEnabledFeatures([]);

    expect(result).toEqual({ ok: true, value: [] });
  });

  it("should reject the submission when a key is outside the supported vocabulary", () => {
    const result = validateEnabledFeatures(["events", "newsletter"]);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/not a supported/i);
  });

  // Not de-duplicated: the checkbox group cannot emit a repeat, so a duplicate
  // means the payload did not come from the UI.
  it("should reject the submission when the same key appears twice", () => {
    const result = validateEnabledFeatures(["events", "events"]);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/once/i);
  });

  it("should reject the submission when the payload is not an array", () => {
    const result = validateEnabledFeatures("events");

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/list of features/i);
  });

  it("should reject the submission when an element is not a string", () => {
    const result = validateEnabledFeatures(["events", 7]);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/not a supported/i);
  });
});

describe("FEATURE_DESCRIPTIONS — member-facing copy for every supported key", () => {
  it("should describe every key in the vocabulary", () => {
    for (const key of FEATURE_KEYS) {
      expect(FEATURE_DESCRIPTIONS[key].label).toBeTruthy();
      expect(FEATURE_DESCRIPTIONS[key].description).toBeTruthy();
    }
  });
});
