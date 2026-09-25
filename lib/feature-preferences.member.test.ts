/**
 * @vitest-environment node
 */
import { FEATURE_KEYS } from "@/lib/feature-keys";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import { isFeatureEnabledForMember } from "./feature-preferences";

describe("isFeatureEnabledForMember — whether a member opted into a feature", () => {
  it("should report every feature enabled when the member kept the full set", () => {
    const profile = makeBaseProfile({ enabled_features: [...FEATURE_KEYS] });

    const enabled = FEATURE_KEYS.map((key) =>
      isFeatureEnabledForMember(profile, key)
    );

    expect(enabled).toEqual(FEATURE_KEYS.map(() => true));
  });

  it("should report every feature disabled when the member deselected everything", () => {
    const profile = makeBaseProfile({ enabled_features: [] });

    const enabled = FEATURE_KEYS.map((key) =>
      isFeatureEnabledForMember(profile, key)
    );

    expect(enabled).toEqual(FEATURE_KEYS.map(() => false));
  });

  it.each(FEATURE_KEYS)(
    "should report only %s enabled when it is the member's sole selection",
    (selected) => {
      const profile = makeBaseProfile({ enabled_features: [selected] });

      const enabled = Object.fromEntries(
        FEATURE_KEYS.map((key) => [key, isFeatureEnabledForMember(profile, key)])
      );

      expect(enabled).toEqual(
        Object.fromEntries(FEATURE_KEYS.map((key) => [key, key === selected]))
      );
    }
  );
});
