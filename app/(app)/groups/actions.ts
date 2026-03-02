"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  generateSlug,
} from "@/lib/groups";

// ─── Create group ─────────────────────────────────────────────────────────────

interface CreateGroupInput {
  name: string;
  description: string | null;
  isPrivate: boolean;
}

export async function createGroupAction(
  input: CreateGroupInput
): Promise<{ slug?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!input.name.trim()) return { error: "Group name is required" };

  try {
    const slug = await generateSlug(input.name);
    const group = await createGroup(
      input.name,
      input.description,
      slug,
      input.isPrivate,
      user.id
    );
    revalidatePath("/groups");
    return { slug: group.slug };
  } catch (err) {
    console.error("[createGroupAction]", err);
    return { error: "Failed to create group. Please try again." };
  }
}

// ─── Join group ───────────────────────────────────────────────────────────────

export async function joinGroupAction(
  groupId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await joinGroup(groupId, user.id);
    revalidatePath("/groups");
    revalidatePath(`/groups/[slug]`, "page");
    return {};
  } catch (err) {
    console.error("[joinGroupAction]", err);
    return { error: "Failed to join group. Please try again." };
  }
}

// ─── Leave group ──────────────────────────────────────────────────────────────

export async function leaveGroupAction(
  groupId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const err = await leaveGroup(groupId, user.id);
    if (err) return { error: err };
    revalidatePath("/groups");
    revalidatePath(`/groups/[slug]`, "page");
    return {};
  } catch (err) {
    console.error("[leaveGroupAction]", err);
    return { error: "Failed to leave group. Please try again." };
  }
}

// ─── Update member role ───────────────────────────────────────────────────────

export async function updateMemberRoleAction(
  groupId: string,
  userId: string,
  role: "member" | "admin" | "moderator"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    console.error("[updateMemberRoleAction]", error);
    return { error: "Failed to update role." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  return {};
}

// ─── Remove member (admin action) ────────────────────────────────────────────

export async function removeMemberAction(
  groupId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify the current user is an admin
  const { data: adminCheck } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (adminCheck?.role !== "admin") {
    return { error: "Only admins can remove members" };
  }

  try {
    const err = await leaveGroup(groupId, userId);
    if (err) return { error: err };
    revalidatePath(`/groups/[slug]`, "page");
    return {};
  } catch (err) {
    console.error("[removeMemberAction]", err);
    return { error: "Failed to remove member." };
  }
}
