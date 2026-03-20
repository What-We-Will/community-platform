import type { WhatWeWillMatch } from "./types";

/**
 * `job_applications` row fields (except `user_id`) when saving a Pulsar match to the tracker.
 */
export function jobApplicationInsertFromPulsarMatch(match: WhatWeWillMatch) {
  return {
    company: match.company,
    position: match.roleTitle,
    status: "wishlist" as const,
    notes: `From Pulsar match (${match.label}, score ${match.score}).`,
    url: match.applyUrl || null,
    is_shared: false as const,
  };
}
