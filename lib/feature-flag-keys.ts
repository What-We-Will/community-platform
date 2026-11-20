/**
 * Platform feature flag keys. Kept apart from the server-only resolver in
 * lib/feature-flags.ts so client components and admin UI can use the list.
 */
export const FLAG_KEYS = [
  "jobApplicationTracker",
  "learningTracker",
  "ghostJobBoard",
  "groupLearning",
  "projects",
] as const;

export type FeatureFlag = (typeof FLAG_KEYS)[number];
