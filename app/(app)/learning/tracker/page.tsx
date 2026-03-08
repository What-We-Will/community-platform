import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListTodo } from "lucide-react";
import { LearningTrackerClient } from "./LearningTrackerClient";
import type { TrackerItem } from "../page";
import type { TrackerStatus } from "../learning-tracker-actions";

export interface MyStudyGroup {
  id: string;             // learning_study_groups.id
  name: string;
  description: string | null;
  resource_id: string;
  resource_title: string | null;
  resource_type: string | null;
  group_slug: string | null;
  member_count: number;
}

export default async function LearningTrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Tracker items ────────────────────────────────────────────────────────────
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

  // ── My study groups ──────────────────────────────────────────────────────────
  // 1. Which study groups is this user a member of?
  const { data: memberRows } = await supabase
    .from("learning_study_group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const studyGroupIds = (memberRows ?? []).map((m) => m.group_id);

  let myStudyGroups: MyStudyGroup[] = [];

  if (studyGroupIds.length > 0) {
    // 2. Fetch group details + linked resource + real group slug
    const { data: sgRows } = await supabase
      .from("learning_study_groups")
      .select("id, name, description, resource_id, group_id, resource:resource_id(id, title, type), real_group:group_id(id, slug)")
      .in("id", studyGroupIds)
      .order("created_at", { ascending: false });

    // 3. Member counts for all those groups
    const { data: allMembers } = await supabase
      .from("learning_study_group_members")
      .select("group_id")
      .in("group_id", studyGroupIds);

    const memberCount: Record<string, number> = {};
    for (const m of allMembers ?? []) {
      memberCount[m.group_id] = (memberCount[m.group_id] ?? 0) + 1;
    }

    myStudyGroups = (sgRows ?? []).map((g) => {
      const resource = Array.isArray(g.resource) ? (g.resource[0] ?? null) : g.resource;
      const realGroup = Array.isArray(g.real_group) ? (g.real_group[0] ?? null) : g.real_group;
      return {
        id: g.id,
        name: g.name,
        description: g.description ?? null,
        resource_id: g.resource_id,
        resource_title: (resource as { title?: string } | null)?.title ?? null,
        resource_type: (resource as { type?: string } | null)?.type ?? null,
        group_slug: (realGroup as { slug?: string } | null)?.slug ?? null,
        member_count: memberCount[g.id] ?? 0,
      };
    });
  }

  const counts = {
    want_to_take: trackerItems.filter((t) => t.status === "want_to_take").length,
    in_progress:  trackerItems.filter((t) => t.status === "in_progress").length,
    completed:    trackerItems.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
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

      {/* Board + sidebar */}
      <LearningTrackerClient
        trackerItems={trackerItems}
        myStudyGroups={myStudyGroups}
      />
    </div>
  );
}
