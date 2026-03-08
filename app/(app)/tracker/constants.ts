import type { ApplicationStatus } from "./actions";

export const STATUSES: {
  value: ApplicationStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "wishlist",     label: "Wishlist",       color: "text-gray-600",   bg: "bg-gray-100 border-gray-200" },
  { value: "applied",      label: "Applied",        color: "text-blue-600",   bg: "bg-blue-100 border-blue-200" },
  { value: "phone_screen", label: "Phone Screen",   color: "text-yellow-600", bg: "bg-yellow-100 border-yellow-200" },
  { value: "interview",    label: "Interview",      color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
  { value: "offer",        label: "Offer",          color: "text-green-600",  bg: "bg-green-100 border-green-200" },
  { value: "rejected",     label: "Rejected",       color: "text-red-600",    bg: "bg-red-100 border-red-200" },
  { value: "withdrawn",    label: "Withdrawn",      color: "text-slate-500",  bg: "bg-slate-100 border-slate-200" },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));
