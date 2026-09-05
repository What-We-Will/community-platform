/**
 * Member-opted platform features, persisted in profiles.enabled_features.
 *
 * FeatureKey is not FeatureFlag. FeatureFlag (lib/feature-flags.ts) is a
 * platform-level rollout gate; FeatureKey is a member preference. They are
 * separate key spaces with no implicit mapping: nothing derives one from the
 * other, and no key in one space resolves against the other by name. A surface
 * governed by both declares both keys explicitly at that call site.
 *
 * The database CHECK constraints on profiles.enabled_features enforce this
 * same vocabulary; keep the two lists in step.
 */
export const FEATURE_KEYS = [
  "events",
  "discussions",
  "job_referrals",
  "resource_hub",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];
