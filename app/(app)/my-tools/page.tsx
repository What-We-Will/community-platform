import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MyToolsClient from "./MyToolsClient";
import { WhatWeWillMatch } from "@/lib/pulsar/types";

type MatchRunRow = {
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

  const [{ data: latestMatchRun }, { data: latestBrief }] = await Promise.all([
    supabase
      .from("member_match_runs")
      .select("request_id, candidate_summary, matches, created_at")
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
  ]);

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
    />
  );
}

