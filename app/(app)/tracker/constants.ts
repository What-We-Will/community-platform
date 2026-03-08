import type { ApplicationStatus } from "./actions";

export const STATUSES: {
  value: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
  columnBg: string;
}[] = [
  { value: "wishlist",         label: "Wishlist",             color: "text-rose-600",    bg: "bg-rose-100 border-rose-200",     columnBg: "bg-rose-50" },
  { value: "applied",          label: "Applied",              color: "text-orange-600",  bg: "bg-orange-100 border-orange-200", columnBg: "bg-orange-50" },
  { value: "phone_screen",     label: "Phone Screen",         color: "text-yellow-600",  bg: "bg-yellow-100 border-yellow-200", columnBg: "bg-yellow-50" },
  { value: "first_interview",  label: "First Interview",      color: "text-green-700",   bg: "bg-green-100 border-green-200",   columnBg: "bg-green-50" },
  { value: "second_interview", label: "Second Interview",     color: "text-teal-700",    bg: "bg-teal-100 border-teal-200",     columnBg: "bg-teal-50" },
  { value: "third_interview",  label: "Third Interview",      color: "text-blue-700",    bg: "bg-blue-100 border-blue-200",     columnBg: "bg-blue-50" },
  { value: "offer",            label: "Offer",                color: "text-indigo-700",  bg: "bg-indigo-100 border-indigo-200", columnBg: "bg-indigo-50" },
  { value: "rejected",         label: "Rejected / Withdrawn", color: "text-violet-700",  bg: "bg-violet-100 border-violet-200", columnBg: "bg-violet-50" },
];

export const STATUS_MAP: Record<string, (typeof STATUSES)[number]> = {
  ...Object.fromEntries(STATUSES.map((s) => [s.value, s])),
  // Map legacy values to their display equivalents
  withdrawn: { value: "rejected",        label: "Rejected / Withdrawn", color: "text-violet-700", bg: "bg-violet-100 border-violet-200", columnBg: "bg-violet-50" },
  interview: { value: "first_interview", label: "First Interview",      color: "text-green-700",  bg: "bg-green-100 border-green-200",   columnBg: "bg-green-50" },
};
