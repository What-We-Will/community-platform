import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LearningClient } from "./LearningClient";
import type { LearningPath, LearningPathItem, LearningResource } from "./types";
import type { TrackerStatus } from "./learning-tracker-actions";

export interface TrackerItem {
  id: string;
  resource_id: string;
  status: TrackerStatus;
  notes: string | null;
  resource: {
    id: string;
    type: string;
    title: string;
    url: string;
    description: string | null;
  } | null;
}

export interface StudyGroupRow {
  id: string;
  resource_id: string;
  name: string;
  description: string | null;
  created_by: string;
  group_id: string | null;
  group_slug: string | null;
  member_count: number;
  is_member: boolean;
  creator: { id: string; display_name: string } | null;
}

export default async function GroupLearningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: paths },
    { data: pathItems },
    { data: resources },
    { data: profile },
    { data: rawTrackerItems },
    { data: rawStudyGroups },
    { data: allMembers },
  ] = await Promise.all([
    supabase
      .from("learning_paths")
      .select("id, title, description, is_starred, created_by, created_at, creator:created_by(id, display_name)")
      .order("is_starred", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_path_items")
      .select("id, path_id, title, url, description, position")
      .order("position", { ascending: true }),
    supabase
      .from("learning_resources")
      .select("id, type, title, url, description, added_by, created_at, adder:added_by(id, display_name)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("personal_learning_items")
      .select("id, resource_id, status, notes, resource:resource_id(id, type, title, url, description)")
      .eq("user_id", user.id),
    supabase
      .from("learning_study_groups")
      .select("id, resource_id, name, description, created_by, created_at, group_id, group:group_id(id, slug), creator:created_by(id, display_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("learning_study_group_members")
      .select("group_id, user_id"),
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  // Normalize paths
  const normalizedPaths: LearningPath[] = (paths ?? []).map((p) => ({
    ...p,
    creator: (Array.isArray(p.creator) ? (p.creator[0] ?? null) : p.creator) as LearningPath["creator"],
  }));

  // Normalize resources
  const normalizedResources: LearningResource[] = (resources ?? []).map((r) => ({
    ...r,
    type: r.type as LearningResource["type"],
    adder: (Array.isArray(r.adder) ? (r.adder[0] ?? null) : r.adder) as LearningResource["adder"],
  }));

  // Group path items
  const itemsByPath: Record<string, LearningPathItem[]> = {};
  for (const item of pathItems ?? []) {
    if (!itemsByPath[item.path_id]) itemsByPath[item.path_id] = [];
    itemsByPath[item.path_id].push(item as LearningPathItem);
  }

  // Normalize tracker items
  const trackerItems: TrackerItem[] = (rawTrackerItems ?? []).map((t) => ({
    id: t.id,
    resource_id: t.resource_id,
    status: t.status as TrackerStatus,
    notes: t.notes ?? null,
    resource: (Array.isArray(t.resource) ? (t.resource[0] ?? null) : t.resource) as TrackerItem["resource"],
  }));

  // Build fast lookup: resourceId → tracker item
  const trackerByResource: Record<string, { id: string; status: TrackerStatus }> = {};
  for (const t of trackerItems) {
    trackerByResource[t.resource_id] = { id: t.id, status: t.status };
  }

  // Build member maps: groupId → array of user IDs, + set of groups current user is in
  const membersByGroup: Record<string, string[]> = {};
  const myGroupIds = new Set<string>();
  for (const m of allMembers ?? []) {
    if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
    membersByGroup[m.group_id].push(m.user_id);
    if (m.user_id === user.id) myGroupIds.add(m.group_id);
  }

  // Normalize study groups
  const studyGroupsByResource: Record<string, StudyGroupRow[]> = {};
  for (const g of rawStudyGroups ?? []) {
    const groupRaw = Array.isArray(g.group) ? (g.group[0] ?? null) : g.group;
    const row: StudyGroupRow = {
      id: g.id,
      resource_id: g.resource_id,
      name: g.name,
      description: g.description ?? null,
      created_by: g.created_by,
      group_id: (groupRaw as { id: string; slug: string } | null)?.id ?? null,
      group_slug: (groupRaw as { id: string; slug: string } | null)?.slug ?? null,
      member_count: membersByGroup[g.id]?.length ?? 0,
      is_member: myGroupIds.has(g.id),
      creator: (Array.isArray(g.creator) ? (g.creator[0] ?? null) : g.creator) as StudyGroupRow["creator"],
    };
    if (!studyGroupsByResource[g.resource_id]) studyGroupsByResource[g.resource_id] = [];
    studyGroupsByResource[g.resource_id].push(row);
  }

  return (
    <LearningClient
      paths={normalizedPaths}
      itemsByPath={itemsByPath}
      resources={normalizedResources}
      currentUserId={user.id}
      isPlatformAdmin={isPlatformAdmin}
      trackerByResource={trackerByResource}
      studyGroupsByResource={studyGroupsByResource}
    />
  );
}
