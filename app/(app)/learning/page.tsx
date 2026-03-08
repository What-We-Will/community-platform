import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LearningClient } from "./LearningClient";
import type { LearningPath, LearningPathItem, LearningResource } from "./types";

export default async function GroupLearningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: paths },
    { data: pathItems },
    { data: resources },
    { data: profile },
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
  ]);

  const isPlatformAdmin = profile?.role === "admin";

  const normalizedPaths: LearningPath[] = (paths ?? []).map((p) => ({
    ...p,
    creator: (Array.isArray(p.creator) ? (p.creator[0] ?? null) : p.creator) as LearningPath["creator"],
  }));

  const normalizedResources: LearningResource[] = (resources ?? []).map((r) => ({
    ...r,
    type: r.type as LearningResource["type"],
    adder: (Array.isArray(r.adder) ? (r.adder[0] ?? null) : r.adder) as LearningResource["adder"],
  }));

  const itemsByPath: Record<string, LearningPathItem[]> = {};
  for (const item of pathItems ?? []) {
    if (!itemsByPath[item.path_id]) itemsByPath[item.path_id] = [];
    itemsByPath[item.path_id].push(item as LearningPathItem);
  }

  return (
    <LearningClient
      paths={normalizedPaths}
      itemsByPath={itemsByPath}
      resources={normalizedResources}
      currentUserId={user.id}
      isPlatformAdmin={isPlatformAdmin}
    />
  );
}
