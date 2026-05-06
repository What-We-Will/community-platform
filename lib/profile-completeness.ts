/**
 * Fields that feed Pulsar match/brief payloads (see my-tools/actions buildProfilePayload).
 * Used for in-app nudges to improve match quality.
 */
export type ProfileCompletenessInput = {
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  location: string | null;
};

export type ProfileCompleteness = {
  /** 0–100 */
  score: number;
  /** Human-readable missing items (for UI / email copy). */
  missing: string[];
  /** Convenience: score >= 80 */
  isStrong: boolean;
};

const MIN_SKILLS = 2;

/**
 * Weighted score aligned with how much each field helps matching.
 */
export function getProfileCompleteness(
  p: ProfileCompletenessInput
): ProfileCompleteness {
  const missing: string[] = [];
  let score = 0;

  if (p.linkedin_url?.trim()) {
    score += 25;
  } else {
    missing.push("LinkedIn URL");
  }

  if (p.headline?.trim()) {
    score += 20;
  } else {
    missing.push("Headline");
  }

  if (p.bio?.trim() && p.bio.trim().length >= 40) {
    score += 25;
  } else if (p.bio?.trim()) {
    score += 12;
    missing.push("A longer bio (40+ characters)");
  } else {
    missing.push("Bio");
  }

  const skillCount = (p.skills ?? []).filter((s) => s.trim().length > 0).length;
  if (skillCount >= MIN_SKILLS) {
    score += 15;
  } else {
    missing.push(`At least ${MIN_SKILLS} skills`);
  }

  if (p.location?.trim()) {
    score += 15;
  } else {
    missing.push("Location");
  }

  const capped = Math.min(100, score);
  return {
    score: capped,
    missing,
    isStrong: capped >= 80,
  };
}
