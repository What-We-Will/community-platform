"use server";

/**
 * My Tools ↔ Pulsar: all match and career-brief calls are **user-triggered** only
 * (buttons in the UI). There is no scheduled batch refresh in this app—doing so
 * would scale cost with membership (ATS + LLM). For periodic nudges without API
 * cost, see the weekly email cron (`/api/cron/my-tools-reminders`) and
 * `docs/mytools-refresh.md`.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchPulsarBrief, fetchPulsarMatches } from "@/lib/pulsar/client";
import {
  buildWhatWeWillBriefRequest,
  buildWhatWeWillProfilePayload,
} from "@/lib/pulsar/profile-payload";
import { jobApplicationInsertFromPulsarMatch } from "@/lib/pulsar/tracker-from-match";
import type { WhatWeWillMatch } from "@/lib/pulsar/types";

type ActionResult = { error?: string; ok?: true };
const PULSAR_ACTION_COOLDOWN_SECONDS = 300;

async function checkRecentUserRun(
  table: "member_match_runs" | "member_career_briefs",
  userId: string
): Promise<ActionResult | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  if (!data?.created_at) return null;

  const ageSeconds = Math.floor(
    (Date.now() - new Date(data.created_at).getTime()) / 1000
  );
  if (ageSeconds < PULSAR_ACTION_COOLDOWN_SECONDS) {
    const waitSeconds = PULSAR_ACTION_COOLDOWN_SECONDS - ageSeconds;
    return {
      error: `Please wait ${waitSeconds}s before running this again.`,
    };
  }

  return null;
}

export async function refreshLiveMatches(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const cooldown = await checkRecentUserRun("member_match_runs", user.id);
  if (cooldown) return cooldown;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, headline, bio, skills, linkedin_url, location")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Unable to load profile for matching" };
  }

  const payload = buildWhatWeWillProfilePayload(profile);

  try {
    const response = await fetchPulsarMatches(payload);
    const { error: insertError } = await supabase.from("member_match_runs").insert({
      user_id: user.id,
      request_id: response.requestId,
      candidate_summary: response.candidateSummary,
      matches: response.matches,
    });

    if (insertError) return { error: insertError.message };

    revalidatePath("/my-tools");
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to fetch live matches" };
  }
}

export async function generateCareerBrief(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const cooldown = await checkRecentUserRun("member_career_briefs", user.id);
  if (cooldown) return cooldown;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, headline, bio, skills, linkedin_url, location")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Unable to load profile for brief generation" };
  }

  const briefPayload = buildWhatWeWillBriefRequest(profile);

  try {
    const response = await fetchPulsarBrief(briefPayload);

    const { error: insertError } = await supabase.from("member_career_briefs").insert({
      user_id: user.id,
      request_id: response.requestId,
      markdown: response.markdown,
      model: response.model,
      generated_at: response.generatedAt,
    });

    if (insertError) return { error: insertError.message };

    revalidatePath("/my-tools");
    return { ok: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to generate career brief",
    };
  }
}

export async function saveMatchToTracker(
  matchRunId: string,
  matchIndex: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!matchRunId.trim()) return { error: "Missing match run id" };
  if (!Number.isInteger(matchIndex) || matchIndex < 0) {
    return { error: "Invalid match index" };
  }

  const { data: run, error: runError } = await supabase
    .from("member_match_runs")
    .select("matches")
    .eq("id", matchRunId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (runError || !run || !Array.isArray(run.matches)) {
    return { error: "Unable to load match run" };
  }

  const selected = run.matches[matchIndex];
  if (!selected || typeof selected !== "object") {
    return { error: "Selected match not found" };
  }

  const match = selected as Partial<WhatWeWillMatch>;
  if (
    typeof match.company !== "string" ||
    typeof match.roleTitle !== "string" ||
    typeof match.label !== "string" ||
    typeof match.score !== "number"
  ) {
    return { error: "Stored match has invalid shape" };
  }

  const { error } = await supabase.from("job_applications").upsert(
    {
      user_id: user.id,
      ...jobApplicationInsertFromPulsarMatch(match as WhatWeWillMatch),
    },
    {
      onConflict: "user_id,company,position,url",
      ignoreDuplicates: true,
    }
  );

  if (error) return { error: error.message };
  revalidatePath("/tracker");
  revalidatePath("/my-tools");
  return { ok: true };
}

