import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackerClient, type Application } from "./TrackerClient";
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
      />
    </div>
  );
}
