export const eventTypeConfig: Record<
  string,
  { label: string; color: string }
> = {
  skillshare: {
    label: "Skillshare",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  workshop: {
    label: "Workshop",
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  },
  ama: {
    label: "AMA",
    color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
  },
  mock_interview: {
    label: "Mock Interview",
    color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  },
  social: {
    label: "Social",
    color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800",
  },
  other: {
    label: "Other",
    color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
};

export const eventTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "skillshare", label: "Skillshare" },
  { value: "workshop", label: "Workshop" },
  { value: "ama", label: "AMA" },
  { value: "mock_interview", label: "Mock Interview" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];
