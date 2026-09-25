import { FEATURE_KEYS, type FeatureKey } from "@/lib/feature-keys";
import type { Profile } from "@/lib/types";

/** Member-facing copy: what a member sees, not what the platform ships. */
export const FEATURE_DESCRIPTIONS: Record<
  FeatureKey,
  { label: string; description: string }
> = {
  events: {
    label: "Events",
    description: "Community events and the weekly schedule",
  },
  discussions: {
    label: "Discussions",
    description: "Groups and group conversations",
  },
  job_referrals: {
    label: "Job referrals",
    description: "The Ghost Job Board and referral opportunities",
  },
  resource_hub: {
    label: "Resource hub",
    description: "Curated links and resources",
  },
};

export type EnabledFeaturesValidation =
  | { ok: true; value: FeatureKey[] }
  | { ok: false; error: string };

const SUPPORTED_KEYS = new Set<string>(FEATURE_KEYS);

function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === "string" && SUPPORTED_KEYS.has(value);
}

/**
 * Validates a submitted feature selection. Duplicates are rejected rather than
 * de-duplicated: the checkbox group cannot emit one, so a repeat means the
 * payload did not come from the UI. The database CHECK constraints reject the
 * same shapes, so this only turns a write failure into a readable message.
 */
export function validateEnabledFeatures(
  input: unknown
): EnabledFeaturesValidation {
  if (!Array.isArray(input)) {
    return { ok: false, error: "Select your features as a list of features." };
  }

  const seen = new Set<FeatureKey>();
  for (const entry of input) {
    if (!isFeatureKey(entry)) {
      return { ok: false, error: "That is not a supported platform feature." };
    }
    if (seen.has(entry)) {
      return { ok: false, error: "Each feature may be selected only once." };
    }
    seen.add(entry);
  }

  return { ok: true, value: FEATURE_KEYS.filter((key) => seen.has(key)) };
}

/**
 * Whether the member opted into a feature. Preference only: it never reads
 * flag state, and a surface governed by both must check both.
 */
export function isFeatureEnabledForMember(
  profile: Pick<Profile, "enabled_features">,
  key: FeatureKey
): boolean {
  return profile.enabled_features.includes(key);
}
