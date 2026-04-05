"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ORACLE_LAYOFF_Q1_OPTIONS,
  ORACLE_LAYOFF_Q5_OPTIONS,
  ORACLE_LAYOFF_Q8_OPTIONS,
  type OracleLayoffSurveyPayload,
} from "@/lib/surveys/oracle-layoff";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_PER_WINDOW = 10;

const MAX_SHORT = 2000;
const MAX_LONG = 50_000;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function pruneRateBuckets() {
  if (rateLimitBuckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of rateLimitBuckets) {
    if (now > v.resetAt) rateLimitBuckets.delete(k);
  }
}

function allowSubmission(ip: string): boolean {
  pruneRateBuckets();
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX_PER_WINDOW) return false;
  bucket.count++;
  return true;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip") ?? "unknown";
}

export type OracleLayoffSurveyResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "rate_limited"
        | "validation_failed"
        | "submission_failed"
        | "server_misconfigured";
    };

function isQ1(v: string): v is OracleLayoffSurveyPayload["q1_status"] {
  return (ORACLE_LAYOFF_Q1_OPTIONS as readonly string[]).includes(v);
}

function isQ5(v: string): v is OracleLayoffSurveyPayload["q5_colleagues_laid_off"] {
  return (ORACLE_LAYOFF_Q5_OPTIONS as readonly string[]).includes(v);
}

function validateQ8(issues: unknown, otherSpecify: string): issues is string[] {
  if (!Array.isArray(issues) || issues.length === 0) return false;
  const allowed = new Set(ORACLE_LAYOFF_Q8_OPTIONS as readonly string[]);
  for (const item of issues) {
    if (typeof item !== "string" || !allowed.has(item)) return false;
  }
  const uniq = new Set(issues);
  if (uniq.has("None of the above") && uniq.size > 1) return false;
  if (uniq.has("Other (please specify)")) {
    const spec = otherSpecify.trim();
    if (!spec) return false;
  }
  return true;
}

export async function submitOracleLayoffSurvey(
  input: OracleLayoffSurveyPayload
): Promise<OracleLayoffSurveyResult> {
  const ip = await getClientIp();
  if (!allowSubmission(ip)) {
    return { ok: false, error: "rate_limited" };
  }

  if (!isQ1(input.q1_status)) {
    return { ok: false, error: "validation_failed" };
  }
  if (!isQ5(input.q5_colleagues_laid_off)) {
    return { ok: false, error: "validation_failed" };
  }

  const q2 = input.q2_last_day.trim().slice(0, MAX_SHORT);
  const q3 = input.q3_team.trim().slice(0, MAX_SHORT);
  const q4 = input.q4_pillar.trim().slice(0, MAX_SHORT);
  const q8_other = input.q8_other_specify.trim().slice(0, MAX_SHORT);
  const q9 = input.q9_grievances.trim().slice(0, MAX_LONG);
  const q10 = input.q10_additional.trim().slice(0, MAX_LONG);

  if (!q2 || !q3 || !q4) {
    return { ok: false, error: "validation_failed" };
  }

  if (!validateQ8(input.q8_issues, q8_other)) {
    return { ok: false, error: "validation_failed" };
  }

  const survey_data: OracleLayoffSurveyPayload = {
    q1_status: input.q1_status,
    q2_last_day: q2,
    q3_team: q3,
    q4_pillar: q4,
    q5_colleagues_laid_off: input.q5_colleagues_laid_off,
    q8_issues: [...new Set(input.q8_issues as string[])],
    q8_other_specify: input.q8_issues.includes("Other (please specify)")
      ? q8_other
      : "",
    q9_grievances: q9,
    q10_additional: q10,
  };

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return { ok: false, error: "server_misconfigured" };
  }

  const { error } = await supabase.from("oracle_layoff_survey_responses").insert({
    ip_address: ip,
    survey_data,
  });

  if (error) {
    console.error("[oracle-layoff-survey] insert error:", error);
    return { ok: false, error: "submission_failed" };
  }

  return { ok: true };
}
