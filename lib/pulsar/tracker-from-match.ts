import type { WhatWeWillMatch } from "./types";

function normalizeHttpUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * `job_applications` row fields (except `user_id`) when saving a Pulsar match to the tracker.
 */
export function jobApplicationInsertFromPulsarMatch(match: WhatWeWillMatch) {
  return {
    company: match.company,
    position: match.roleTitle,
    status: "wishlist" as const,
    notes: `From Pulsar match (${match.label}, score ${match.score}).`,
    url: normalizeHttpUrl(match.applyUrl),
    is_shared: false as const,
  };
}
