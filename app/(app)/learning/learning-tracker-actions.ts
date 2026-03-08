"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  if (error) return { error: error.message };
  revalidatePath("/learning");
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
  if (error) return { error: error.message };
  revalidatePath("/learning");
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
  if (error) return { error: error.message };
  revalidatePath("/learning");
  return {};
}

// ── Study Groups ─────────────────────────────────────────────────────────────

export async function createStudyGroup(
  resourceId: string,
  name: string,
  description: string,
): Promise<{ error?: string; groupId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("learning_study_groups")
    .insert({
      resource_id: resourceId,
      created_by: user.id,
      name: name.trim(),
      description: description.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Auto-join the creator
  await supabase
    .from("learning_study_group_members")
    .insert({ group_id: data.id, user_id: user.id });

  revalidatePath("/learning");
  return { groupId: data.id };
}

export async function joinStudyGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("learning_study_group_members")
    .insert({ group_id: groupId, user_id: user.id });
  if (error) return { error: error.message };
  revalidatePath("/learning");
  return {};
}

export async function leaveStudyGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("learning_study_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/learning");
  return {};
}

export async function deleteStudyGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: group } = await supabase
    .from("learning_study_groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group) return { error: "Group not found" };
  if (group.created_by !== user.id && profile?.role !== "admin")
    return { error: "Not authorized" };

  const { error } = await supabase.from("learning_study_groups").delete().eq("id", groupId);
  if (error) return { error: error.message };
  revalidatePath("/learning");
  return {};
}
