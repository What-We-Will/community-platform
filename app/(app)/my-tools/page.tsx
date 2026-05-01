import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MyToolsClient from "./MyToolsClient";
import { WhatWeWillMatch } from "@/lib/pulsar/types";
import { getProfileCompleteness } from "@/lib/profile-completeness";

type MatchRunRow = {
  id: string;
  request_id: string;
  candidate_summary: string;
  matches: unknown;
  created_at: string;
};

type BriefRow = {
  request_id: string;
  markdown: string;
  model: string;
  generated_at: string;
  created_at: string;
};

export default async function MyToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: latestMatchRun },
    { data: latestBrief },
    { data: profileRow },
  ] = await Promise.all([
    supabase
      .from("member_match_runs")
      .select("id, request_id, candidate_summary, matches, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("member_career_briefs")
      .select("request_id, markdown, model, generated_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("headline, bio, skills, linkedin_url, location")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const profileCompleteness = getProfileCompleteness({
    headline: profileRow?.headline ?? null,
    bio: profileRow?.bio ?? null,
    skills: profileRow?.skills ?? null,
    linkedin_url: profileRow?.linkedin_url ?? null,
    location: profileRow?.location ?? null,
  });

  let matchRunAgeDays: number | null = null;
  if (latestMatchRun?.created_at) {
    // Server component — Date.now() is safe here (runs once per request, not in a client render loop)
    // eslint-disable-next-line react-hooks/purity
    const ms = Date.now() - new Date(latestMatchRun.created_at).getTime();
    matchRunAgeDays = Math.floor(ms / (24 * 60 * 60 * 1000));
  }

  const normalizedMatchRun = latestMatchRun
    ? {
        ...(latestMatchRun as MatchRunRow),
        matches: Array.isArray((latestMatchRun as MatchRunRow).matches)
          ? ((latestMatchRun as MatchRunRow).matches as WhatWeWillMatch[])
          : [],
      }
    : null;

  return (
    <MyToolsClient
      latestMatchRun={normalizedMatchRun}
      latestBrief={(latestBrief as BriefRow | null) ?? null}
      profileCompleteness={profileCompleteness}
      matchRunAgeDays={matchRunAgeDays}
    />
  );
}

