import type { ApplicationStatus } from "./actions";

export const STATUSES: {
  value: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "wishlist",        label: "Wishlist",          color: "text-gray-600",   bg: "bg-gray-100 border-gray-200" },
  { value: "applied",         label: "Applied",           color: "text-blue-600",   bg: "bg-blue-100 border-blue-200" },
  { value: "phone_screen",    label: "Phone Screen",      color: "text-yellow-600", bg: "bg-yellow-100 border-yellow-200" },
  { value: "first_interview", label: "First Interview",   color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
  { value: "second_interview",label: "Second Interview",  color: "text-violet-600", bg: "bg-violet-100 border-violet-200" },
  { value: "third_interview", label: "Third Interview",   color: "text-fuchsia-600",bg: "bg-fuchsia-100 border-fuchsia-200" },
  { value: "offer",           label: "Offer",             color: "text-green-600",  bg: "bg-green-100 border-green-200" },
  { value: "rejected",        label: "Rejected / Withdrawn", color: "text-red-600", bg: "bg-red-100 border-red-200" },
];

export const STATUS_MAP: Record<string, (typeof STATUSES)[number]> = {
  ...Object.fromEntries(STATUSES.map((s) => [s.value, s])),
  // Map legacy 'withdrawn' and 'interview' to their display equivalents
  withdrawn: { value: "rejected", label: "Rejected / Withdrawn", color: "text-red-600", bg: "bg-red-100 border-red-200" },
  interview: { value: "first_interview", label: "First Interview", color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
};
