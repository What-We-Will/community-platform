"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  generateSlug,
} from "@/lib/groups";
import type { GroupJoinRequest } from "@/lib/types";

// ─── Create group ─────────────────────────────────────────────────────────────

interface CreateGroupInput {
  name: string;
  description: string | null;
  isPrivate: boolean;
  isDiscoverable: boolean;
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
      user.id,
      input.isDiscoverable
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

// ─── Request to join private group ───────────────────────────────────────────

export async function requestJoinGroupAction(
  groupId: string,
  message?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("group_join_requests").insert({
    group_id: groupId,
    user_id: user.id,
    message: message || null,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already requested to join this group." };
    console.error("[requestJoinGroupAction]", error);
    return { error: "Failed to submit request. Please try again." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  return {};
}

// ─── Withdraw join request ────────────────────────────────────────────────────

export async function withdrawJoinRequestAction(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_join_requests")
    .delete()
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("[withdrawJoinRequestAction]", error);
    return { error: "Failed to withdraw request." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  return {};
}

// ─── Approve join request (admin) ─────────────────────────────────────────────

export async function approveJoinRequestAction(
  request: GroupJoinRequest
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    // Add the user to the group
    await joinGroup(request.group_id, request.user_id);

    // Mark request as approved
    await supabase
      .from("group_join_requests")
      .update({ status: "approved" })
      .eq("id", request.id);

    revalidatePath(`/groups/[slug]`, "page");
    return {};
  } catch (err) {
    console.error("[approveJoinRequestAction]", err);
    return { error: "Failed to approve request." };
  }
}

// ─── Reject join request (admin) ──────────────────────────────────────────────

export async function rejectJoinRequestAction(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_join_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (error) {
    console.error("[rejectJoinRequestAction]", error);
    return { error: "Failed to reject request." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  return {};
}

// ─── Invite member (admin directly adds a user) ───────────────────────────────

export async function inviteMemberAction(
  groupId: string,
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: adminCheck } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (adminCheck?.role !== "admin") return { error: "Only admins can invite members" };

  try {
    await joinGroup(groupId, userId);
    revalidatePath(`/groups/[slug]`, "page");
    return {};
  } catch (err) {
    console.error("[inviteMemberAction]", err);
    return { error: "Failed to invite member. They may already be in the group." };
  }
}

// ─── Update group settings (admin) ───────────────────────────────────────────

export async function updateGroupSettingsAction(
  groupId: string,
  settings: {
    is_discoverable?: boolean;
    is_private?: boolean;
    name?: string;
    description?: string | null;
    archived?: boolean;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (settings.name !== undefined) payload.name = settings.name;
  if (settings.description !== undefined) payload.description = settings.description;
  if (settings.is_private !== undefined) payload.is_private = settings.is_private;
  if (settings.is_discoverable !== undefined) payload.is_discoverable = settings.is_discoverable;
  if (settings.archived !== undefined) payload.archived = settings.archived;

  const { error } = await supabase
    .from("groups")
    .update(payload)
    .eq("id", groupId);

  if (error) {
    console.error("[updateGroupSettingsAction]", error);
    return { error: "Failed to update settings." };
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/[slug]`, "page");
  return {};
}
