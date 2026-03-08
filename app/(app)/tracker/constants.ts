import type { ApplicationStatus } from "./actions";

export const STATUSES: {
  value: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
  columnBg: string;
}[] = [
  { value: "wishlist",         label: "Wishlist",             color: "text-red-700",     bg: "bg-red-200 border-red-300",       columnBg: "bg-red-100" },
  { value: "applied",          label: "Applied",              color: "text-orange-700",  bg: "bg-orange-200 border-orange-300", columnBg: "bg-orange-100" },
  { value: "phone_screen",     label: "Phone Screen",         color: "text-yellow-700",  bg: "bg-yellow-200 border-yellow-300", columnBg: "bg-yellow-100" },
  { value: "first_interview",  label: "First Interview",      color: "text-green-700",   bg: "bg-green-200 border-green-300",   columnBg: "bg-green-100" },
  { value: "second_interview", label: "Second Interview",     color: "text-blue-700",    bg: "bg-blue-200 border-blue-300",     columnBg: "bg-blue-100" },
  { value: "third_interview",  label: "Third Interview",      color: "text-indigo-700",  bg: "bg-indigo-200 border-indigo-300", columnBg: "bg-indigo-100" },
  { value: "offer",            label: "Offer",                color: "text-violet-700",  bg: "bg-violet-200 border-violet-300", columnBg: "bg-violet-100" },
  { value: "rejected",         label: "Rejected / Withdrawn", color: "text-gray-500",    bg: "bg-gray-200 border-gray-300",     columnBg: "bg-gray-100" },
];

export const STATUS_MAP: Record<string, (typeof STATUSES)[number]> = {
  ...Object.fromEntries(STATUSES.map((s) => [s.value, s])),
  // Map legacy values to their display equivalents
  withdrawn: { value: "rejected",        label: "Rejected / Withdrawn", color: "text-gray-500",  bg: "bg-gray-200 border-gray-300",   columnBg: "bg-gray-100" },
  interview: { value: "first_interview", label: "First Interview",      color: "text-green-700", bg: "bg-green-200 border-green-300",  columnBg: "bg-green-100" },
};
