export type ScheduleCategory =
  | "general"
  | "job_seekers"
  | "organizers_volunteers";

/** Maps to brand tiers in app/globals.css */
type ScheduleBrandTone = "primary" | "green" | "tertiary";

export interface ScheduleRow {
  id: string;
  name: string;
  days: string;
  time: string;
  zoom_url: string | null;
  position: number;
  category: ScheduleCategory;
}

export const SCHEDULE_CATEGORIES: {
  value: ScheduleCategory;
  label: string;
  nextButtonLabel?: string;
  tone: ScheduleBrandTone;
}[] = [
  { value: "general", label: "General Meetings", tone: "green" },
  {
    value: "job_seekers",
    label: "Job Seekers",
    nextButtonLabel: "Job Seekers Events",
    tone: "tertiary",
  },
  {
    value: "organizers_volunteers",
    label: "Organizers & Volunteers",
    tone: "primary",
  },
];

export function getScheduleCategoryConfig(category: ScheduleCategory) {
  const config =
    SCHEDULE_CATEGORIES.find((c) => c.value === category) ??
    SCHEDULE_CATEGORIES[0];

  const { tone } = config;
  return {
    ...config,
    tabActive: `schedule-tab-active-${tone}`,
    tabInactive: `schedule-tab-inactive-${tone}`,
    joinButton: `schedule-join-${tone}`,
  };
}

export function getNextScheduleCategory(
  category: ScheduleCategory
): ScheduleCategory {
  const index = SCHEDULE_CATEGORIES.findIndex((c) => c.value === category);
  const nextIndex = (index + 1) % SCHEDULE_CATEGORIES.length;
  return SCHEDULE_CATEGORIES[nextIndex].value;
}
