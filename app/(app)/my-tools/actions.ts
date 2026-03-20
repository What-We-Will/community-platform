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
  WhatWeWillMatch,
  WhatWeWillProfileRequest,
} from "@/lib/pulsar/types";

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

  const payload = buildProfilePayload(profile);

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

  const payload = buildProfilePayload(profile);

  try {
    const response = await fetchPulsarBrief({
      ...payload,
      tone: "supportive",
      maxWords: 700,
      includeIllustrativeLinks: true,
    });

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
    company: match.company,
    position: match.roleTitle,
    status: "wishlist",
    notes: `From Pulsar match (${match.label}, score ${match.score}).`,
    url: match.applyUrl || null,
    is_shared: false,
  });

  if (error) return { error: error.message };
  revalidatePath("/tracker");
  revalidatePath("/my-tools");
  return { ok: true };
}

function buildProfilePayload(profile: {
  id: string;
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  linkedin_url: string | null;
  location: string | null;
}): WhatWeWillProfileRequest {
  const inferredRoleTitles = profile.headline
    ? profile.headline
        .split(/[|,/]/g)
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    personId: profile.id,
    linkedinUrl: profile.linkedin_url ?? undefined,
    resumeText: undefined,
    skills: profile.skills ?? [],
    experienceSummary: profile.bio ?? undefined,
    interestedIndustries: [],
    interestedRoleTitles: inferredRoleTitles,
    preferredWorkTypes: ["remote", "hybrid"],
    preferredLocations: profile.location ? [profile.location] : [],
  };
}

