import type { FeatureFlag } from "@/lib/feature-flags";

export const FEATURE_FLAG_LABELS: Record<FeatureFlag, string> = {
  jobApplicationTracker: "Job Application Tracker",
  learningTracker: "Learning Tracker",
  ghostJobBoard: "Ghost Job Board",
  groupLearning: "Group Learning",
  projects: "Projects",
};
