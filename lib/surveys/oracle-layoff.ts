export const ORACLE_LAYOFF_Q1_OPTIONS = [
  "I am an Oracle FTE who was recently laid off or notified that I will be laid off shortly",
  "I am an Oracle contractor / vendor who was recently laid off or notified that I will be laid off shortly",
  "I am currently employed as an FTE at Oracle",
  "I am currently employed as a contractor or vendor at Oracle",
] as const;

export const ORACLE_LAYOFF_Q5_OPTIONS = ["Yes", "No / I'm not sure"] as const;

export const ORACLE_LAYOFF_Q8_OPTIONS = [
  "I believe my severance was calculated incorrectly",
  "I was on parental, disability or medical/FMLA leave when I was laid off",
  "I am an H-1B visa holder and need clarity on my options",
  "I am over 40 and was not informed of my rights under the OWBPA",
  "I am a remote worker and was excluded from WARN Act protections",
  "I felt the DocuSign process was confusing / unclear about what I was agreeing to",
  "My laptop locked me out and I was unable to provide my personal emails to continue getting notices.",
  "None of the above",
  "Other (please specify)",
] as const;

export type OracleLayoffSurveyPayload = {
  q1_status: (typeof ORACLE_LAYOFF_Q1_OPTIONS)[number];
  q2_last_day: string;
  q3_team: string;
  q4_pillar: string;
  q5_colleagues_laid_off: (typeof ORACLE_LAYOFF_Q5_OPTIONS)[number];
  q8_issues: string[];
  q8_other_specify: string;
  q9_grievances: string;
  q10_additional: string;
};
