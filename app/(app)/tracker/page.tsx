import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackerClient, type Application, type CommunityNote } from "./TrackerClient";
import type { Interview, HelpRequest } from "./actions";

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: rawApplications }, { data: rawInterviews }, { data: rawHelp }] = await Promise.all([
    supabase
      .from("job_applications")
      .select("id, company, position, applied_date, status, notes, community_notes, status_dates, url, is_shared, job_posting_id, created_at, user_id, poster:user_id(id, display_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("job_application_interviews")
      .select("id, application_id, user_id, title, interview_date, interview_time, notes, created_at")
      .eq("user_id", user.id)
      .order("interview_date", { ascending: true }),
    supabase
      .from("interview_help_requests")
      .select("id, user_id, application_id, title, company, position, interview_date, stage_key, interview_id, message, is_open, created_at")
      .eq("user_id", user.id)
      .eq("is_open", true),
  ]);

  const applications: Application[] = (rawApplications ?? []).map((a) => ({
    ...a,
    poster: Array.isArray(a.poster) ? (a.poster[0] ?? null) : a.poster,
    status_dates: (a.status_dates ?? {}) as Record<string, string>,
    job_posting_id: a.job_posting_id ?? null,
  }));

  const interviews: Interview[] = (rawInterviews ?? []).map((iv) => ({
    ...iv,
    interview_time: iv.interview_time ?? null,
    notes: iv.notes ?? null,
  }));

  const helpRequests: HelpRequest[] = (rawHelp ?? []).map((h) => ({
    ...h,
    stage_key: h.stage_key ?? null,
    interview_id: h.interview_id ?? null,
    message: h.message ?? null,
  }));

  // ── Community notes for companies the user has applied to ──────────────────
  const myApplications = (rawApplications ?? []).filter((a) => a.user_id === user.id);
  const myCompanies = [...new Set(myApplications.map((a) => a.company))];
  const directPostingIds = [...new Set(
    myApplications.filter((a) => a.job_posting_id).map((a) => a.job_posting_id as string)
  )];

  let communityNotes: CommunityNote[] = [];

  if (myCompanies.length > 0) {
    // Find job postings that match any of the user's applied companies (case-insensitive)
    const orFilter = myCompanies.map((c) => `company.ilike.${c}`).join(",");
    const { data: matchedPostings } = await supabase
      .from("job_postings")
      .select("id, company")
      .or(orFilter);

    const postingIds = [...new Set([
      ...directPostingIds,
      ...(matchedPostings ?? []).map((p) => p.id),
    ])];

    if (postingIds.length > 0) {
      const { data: rawNotes } = await supabase
        .from("job_posting_comments")
        .select("id, job_posting_id, user_id, content, created_at, author:user_id(id, display_name), posting:job_posting_id(company, title, url)")
        .in("job_posting_id", postingIds)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      communityNotes = (rawNotes ?? []).map((n) => ({
        id: n.id,
        job_posting_id: n.job_posting_id,
        user_id: n.user_id,
        content: n.content,
        created_at: n.created_at,
        author: Array.isArray(n.author) ? (n.author[0] ?? null) : (n.author as CommunityNote["author"]),
        posting: Array.isArray(n.posting) ? (n.posting[0] ?? null) : (n.posting as CommunityNote["posting"]),
      }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Application Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your applications and stay organized. Ask for help with mock interviews. Share notes and tips with the community.
        </p>
      </div>
      <TrackerClient
        applications={applications}
        interviews={interviews}
        helpRequests={helpRequests}
        currentUserId={user.id}
        communityNotes={communityNotes}
      />
    </div>
  );
}
