import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListTodo } from "lucide-react";
import { LearningTrackerClient } from "./LearningTrackerClient";
import type { TrackerItem } from "../page";
import type { TrackerStatus } from "../learning-tracker-actions";

export default async function LearningTrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raw } = await supabase
    .from("personal_learning_items")
    .select("id, resource_id, status, notes, resource:resource_id(id, type, title, url, description)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const trackerItems: TrackerItem[] = (raw ?? []).map((t) => ({
    id: t.id,
    resource_id: t.resource_id,
    status: t.status as TrackerStatus,
    notes: t.notes ?? null,
    resource: (Array.isArray(t.resource) ? (t.resource[0] ?? null) : t.resource) as TrackerItem["resource"],
  }));

  const counts = {
    want_to_take: trackerItems.filter((t) => t.status === "want_to_take").length,
    in_progress:  trackerItems.filter((t) => t.status === "in_progress").length,
    completed:    trackerItems.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="size-6 text-primary" />
            Learning Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track courses, videos, and tutorials you want to take, are working through, or have finished.
          </p>
        </div>
        {trackerItems.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-blue-700">{counts.want_to_take}</span> to take ·
              <span className="font-semibold text-amber-700">{counts.in_progress}</span> in progress ·
              <span className="font-semibold text-emerald-700">{counts.completed}</span> completed
            </div>
          </div>
        )}
      </div>

      <LearningTrackerClient trackerItems={trackerItems} />
    </div>
  );
}
