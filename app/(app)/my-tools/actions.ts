"use server";

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

export async function refreshLiveMatches(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

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

export async function saveMatchToTracker(match: WhatWeWillMatch): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("job_applications").insert({
    user_id: user.id,
    ...jobApplicationInsertFromPulsarMatch(match),
  });

  if (error) return { error: error.message };
  revalidatePath("/tracker");
  revalidatePath("/my-tools");
  return { ok: true };
}

