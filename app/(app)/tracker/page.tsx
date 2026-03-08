import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrackerClient, type Application } from "./TrackerClient";

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch own applications + shared applications from others
  const { data: applications } = await supabase
    .from("job_applications")
    .select("*, poster:user_id(id, display_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Application Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your applications and optionally share progress with the community.
        </p>
      </div>
      <TrackerClient
        applications={(applications ?? []) as Application[]}
        currentUserId={user.id}
      />
    </div>
  );
}
