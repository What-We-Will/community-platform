export type JobRole =
  | "backend"
  | "frontend"
  | "full_stack"
  | "data_engineering"
  | "data_science"
  | "machine_learning"
  | "ai"
  | "product"
  | "design"
  | "project_management"
  | "entry_level"
  | "other";

export const JOB_ROLES: { value: JobRole; label: string }[] = [
  { value: "backend",            label: "Backend" },
  { value: "frontend",           label: "Frontend" },
  { value: "full_stack",         label: "Full Stack" },
  { value: "data_engineering",   label: "Data Engineering" },
  { value: "data_science",       label: "Data Science" },
  { value: "machine_learning",   label: "Machine Learning" },
  { value: "ai",                 label: "AI" },
  { value: "product",            label: "Product" },
  { value: "design",             label: "Design" },
  { value: "project_management", label: "Project Management" },
  { value: "entry_level",        label: "Entry Level" },
  { value: "other",              label: "Other" },
];

export const JOB_ROLE_MAP = Object.fromEntries(
  JOB_ROLES.map((r) => [r.value, r.label])
) as Record<JobRole, string>;
