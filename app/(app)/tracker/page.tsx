import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackerClient, type Application } from "./TrackerClient";

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch own applications + shared applications from others
  const { data: rawApplications } = await supabase
    .from("job_applications")
    .select("id, company, position, applied_date, status, notes, community_notes, status_dates, url, is_shared, created_at, user_id, poster:user_id(id, display_name)")
    .order("created_at", { ascending: false });

  const applications: Application[] = (rawApplications ?? []).map((a) => ({
    ...a,
    poster: Array.isArray(a.poster) ? (a.poster[0] ?? null) : a.poster,
    status_dates: (a.status_dates ?? {}) as Record<string, string>,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Application Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your applications and optionally share progress with the community.
        </p>
      </div>
      <TrackerClient
        applications={applications}
        currentUserId={user.id}
      />
    </div>
  );
}
