"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createGroup, generateSlug, joinGroup, leaveGroup } from "@/lib/groups";
import { logger } from "@/lib/logger";

export type TrackerStatus = "want_to_take" | "in_progress" | "completed";

// ── Personal Tracker ──────────────────────────────────────────────────────────

export async function addToTracker(
  resourceId: string,
  status: TrackerStatus = "want_to_take",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("personal_learning_items")
    .insert({ user_id: user.id, resource_id: resourceId, status });
  if (error) {
    logger.error("server-action:error", { action: "addToTracker", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "addToTracker", userId: user.id, resourceId, status, revalidated: ["/learning"] });
  return {};
}

export async function updateTrackerStatus(
  itemId: string,
  status: TrackerStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("personal_learning_items")
    .update({ status })
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    logger.error("server-action:error", { action: "updateTrackerStatus", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "updateTrackerStatus", userId: user.id, itemId, status, revalidated: ["/learning"] });
  return {};
}

export async function removeFromTracker(itemId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("personal_learning_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    logger.error("server-action:error", { action: "removeFromTracker", userId: user.id, error: error.message });
    return { error: error.message };
  }
  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "removeFromTracker", userId: user.id, itemId, revalidated: ["/learning"] });
  return {};
}

// ── Study Groups ──────────────────────────────────────────────────────────────
// Each study group is backed by a real Group (with chat, events, notes).
// learning_study_groups stores the resource link and group_id back-reference.

export async function createStudyGroup(
  resourceId: string,
  name: string,
  description: string,
): Promise<{ error?: string; studyGroupId?: string; groupSlug?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    // 1. Create a real group (public, not discoverable in the groups directory,
    //    flagged as a study group so it doesn't clutter the Groups page).
    const slug = await generateSlug(name);
    const group = await createGroup(
      name.trim(),
      description.trim() || null,
      slug,
      false,   // is_private
      user.id,
      false,   // is_discoverable (hidden from Groups directory)
      true,    // is_study_group
    );

    // 2. Insert into learning_study_groups, linking to the real group.
    const { data, error: sgError } = await supabase
      .from("learning_study_groups")
      .insert({
        resource_id: resourceId,
        created_by: user.id,
        name: name.trim(),
        description: description.trim() || null,
        group_id: group.id,
      })
      .select("id")
      .single();

    if (sgError) return { error: sgError.message };

    // 3. Creator is already in group_members (via create_group_transactional).
    //    Sync them into learning_study_group_members too.
    await supabase
      .from("learning_study_group_members")
      .insert({ group_id: data.id, user_id: user.id })
      .select();

    revalidatePath("/learning");
    logger.info("server-action:complete", { action: "createStudyGroup", userId: user.id, studyGroupId: data.id, groupSlug: group.slug, revalidated: ["/learning"] });
    return { studyGroupId: data.id, groupSlug: group.slug };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create study group";
    logger.error("server-action:error", { action: "createStudyGroup", userId: user.id, error: msg });
    return { error: msg };
  }
}

export async function joinStudyGroup(
  studyGroupId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch the real group_id
  const { data: sg } = await supabase
    .from("learning_study_groups")
    .select("group_id")
    .eq("id", studyGroupId)
    .single();

  // Join the real group (adds to group_members + conversation_participants)
  if (sg?.group_id) {
    try {
      await joinGroup(sg.group_id, user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join group";
      return { error: msg };
    }
  }

  // Also sync into learning_study_group_members
  const { error } = await supabase
    .from("learning_study_group_members")
    .insert({ group_id: studyGroupId, user_id: user.id });
  if (error && error.code !== "23505") {
    logger.error("server-action:error", { action: "joinStudyGroup", userId: user.id, error: error.message });
    return { error: error.message };
  }

  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "joinStudyGroup", userId: user.id, studyGroupId, revalidated: ["/learning"] });
  return {};
}

export async function leaveStudyGroup(
  studyGroupId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch the real group_id
  const { data: sg } = await supabase
    .from("learning_study_groups")
    .select("group_id")
    .eq("id", studyGroupId)
    .single();

  // Leave the real group
  if (sg?.group_id) {
    const err = await leaveGroup(sg.group_id, user.id);
    if (err) return { error: err };
  }

  // Remove from learning_study_group_members
  const { error } = await supabase
    .from("learning_study_group_members")
    .delete()
    .eq("group_id", studyGroupId)
    .eq("user_id", user.id);
  if (error) {
    logger.error("server-action:error", { action: "leaveStudyGroup", userId: user.id, error: error.message });
    return { error: error.message };
  }

  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "leaveStudyGroup", userId: user.id, studyGroupId, revalidated: ["/learning"] });
  return {};
}

export async function deleteStudyGroup(
  studyGroupId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: sg } = await supabase
    .from("learning_study_groups")
    .select("created_by, group_id")
    .eq("id", studyGroupId)
    .single();

  if (!sg) return { error: "Study group not found" };
  if (sg.created_by !== user.id && profile?.role !== "admin")
    return { error: "Not authorized" };

  // Delete the learning_study_groups row (cascades to members)
  const { error: sgErr } = await supabase
    .from("learning_study_groups")
    .delete()
    .eq("id", studyGroupId);
  if (sgErr) return { error: sgErr.message };

  // Delete the backing real group (cascades to group_members, conversation, notes)
  if (sg.group_id) {
    await supabase.from("groups").delete().eq("id", sg.group_id);
  }

  revalidatePath("/learning");
  logger.info("server-action:complete", { action: "deleteStudyGroup", userId: user.id, studyGroupId, revalidated: ["/learning"] });
  return {};
}
