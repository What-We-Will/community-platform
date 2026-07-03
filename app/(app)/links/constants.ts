import type { LinkCategory } from "./actions";

export const CATEGORY_META: Record<
  LinkCategory,
  { label: string; color: string; bg: string }
> = {
  organization: {
    label: "Organization",
    color: "text-blue-700",
    bg: "bg-blue-100 border-blue-200",
  },
  community: {
    label: "Community / Networking",
    color: "text-indigo-700",
    bg: "bg-indigo-100 border-indigo-200",
  },
  job_board_general: {
    label: "General",
    color: "text-violet-700",
    bg: "bg-violet-100 border-violet-200",
  },
  job_board_remote: {
    label: "Remote-Focused",
    color: "text-cyan-700",
    bg: "bg-cyan-100 border-cyan-200",
  },
  job_board_civic: {
    label: "Civic Tech Jobs",
    color: "text-emerald-700",
    bg: "bg-emerald-100 border-emerald-200",
  },
  labor_org: {
    label: "Labor Organization",
    color: "text-rose-700",
    bg: "bg-rose-100 border-rose-200",
  },
  learning: {
    label: "Learning Material",
    color: "text-green-700",
    bg: "bg-green-100 border-green-200",
  },
  tool: {
    label: "Tool / App",
    color: "text-purple-700",
    bg: "bg-purple-100 border-purple-200",
  },
  article: {
    label: "Article / Blog",
    color: "text-amber-700",
    bg: "bg-amber-100 border-amber-200",
  },
  other: {
    label: "Other",
    color: "text-slate-600",
    bg: "bg-slate-100 border-slate-200",
  },
};

export const SECTIONS: {
  id: string;
  heading: string;
  tabLabel: string;
  categories: LinkCategory[];
}[] = [
  {
    id: "organizations",
    heading: "Organizations",
    tabLabel: "Organizations",
    categories: ["organization"],
  },
  {
    id: "communities",
    heading: "Communities & Networking",
    tabLabel: "Communities",
    categories: ["community"],
  },
  {
    id: "job-search",
    heading: "Job Search Platforms",
    tabLabel: "Job Search",
    categories: ["job_board_remote", "job_board_civic", "job_board_general"],
  },
  {
    id: "labor-orgs",
    heading: "Labor Orgs",
    tabLabel: "Labor Orgs",
    categories: ["labor_org"],
  },
  {
    id: "learning",
    heading: "Learning Materials",
    tabLabel: "Learning",
    categories: ["learning"],
  },
  {
    id: "tools",
    heading: "Tools & Apps",
    tabLabel: "Tools",
    categories: ["tool"],
  },
  {
    id: "articles",
    heading: "Articles & Blogs",
    tabLabel: "Articles",
    categories: ["article"],
  },
  {
    id: "other",
    heading: "Other",
    tabLabel: "Other",
    categories: ["other"],
  },
];
