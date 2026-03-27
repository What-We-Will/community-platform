"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createGroup,
  joinGroup,
  leaveGroup,
  generateSlug,
  normalizeSlug,
  isSlugAvailable,
} from "@/lib/groups";
import type { GroupJoinRequest } from "@/lib/types";
import { logger } from "@/lib/logger";

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

  logger.info("server-action:start", { action: "createGroup", userId: user.id, groupName: input.name });

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
    logger.info("server-action:complete", { action: "createGroup", userId: user.id, slug: group.slug, revalidated: ["/groups"] });
    return { slug: group.slug };
  } catch (err) {
    logger.error("server-action:error", { action: "createGroup", userId: user.id, error: String(err) });
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

  logger.info("server-action:start", { action: "joinGroup", userId: user.id, groupId });

  try {
    await joinGroup(groupId, user.id);
    revalidatePath("/groups");
    revalidatePath(`/groups/[slug]`, "page");
    logger.info("server-action:complete", { action: "joinGroup", userId: user.id, groupId, revalidated: ["/groups", "/groups/[slug]"] });
    return {};
  } catch (err) {
    logger.error("server-action:error", { action: "joinGroup", userId: user.id, groupId, error: String(err) });
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

  logger.info("server-action:start", { action: "leaveGroup", userId: user.id, groupId });

  try {
    const err = await leaveGroup(groupId, user.id);
    if (err) return { error: err };
    revalidatePath("/groups");
    revalidatePath(`/groups/[slug]`, "page");
    logger.info("server-action:complete", { action: "leaveGroup", userId: user.id, groupId, revalidated: ["/groups", "/groups/[slug]"] });
    return {};
  } catch (err) {
    logger.error("server-action:error", { action: "leaveGroup", userId: user.id, groupId, error: String(err) });
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
    logger.error("server-action:error", { action: "updateMemberRole", userId: user.id, groupId, targetUserId: userId, error: error.message });
    return { error: "Failed to update role." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "updateMemberRole", userId: user.id, groupId, targetUserId: userId, role, revalidated: ["/groups/[slug]"] });
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
    logger.info("server-action:complete", { action: "removeMember", userId: user.id, groupId, targetUserId: userId, revalidated: ["/groups/[slug]"] });
    return {};
  } catch (err) {
    logger.error("server-action:error", { action: "removeMember", userId: user.id, groupId, error: String(err) });
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
    logger.error("server-action:error", { action: "requestJoinGroup", userId: user.id, groupId, error: error.message });
    return { error: "Failed to submit request. Please try again." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "requestJoinGroup", userId: user.id, groupId, revalidated: ["/groups/[slug]"] });
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
    logger.error("server-action:error", { action: "withdrawJoinRequest", userId: user.id, error: error.message });
    return { error: "Failed to withdraw request." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "withdrawJoinRequest", userId: user.id, revalidated: ["/groups/[slug]"] });
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
    logger.info("server-action:complete", { action: "approveJoinRequest", userId: user.id, requestId: request.id, revalidated: ["/groups/[slug]"] });
    return {};
  } catch (err) {
    logger.error("server-action:error", { action: "approveJoinRequest", userId: user.id, error: String(err) });
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
    logger.error("server-action:error", { action: "rejectJoinRequest", userId: user.id, error: error.message });
    return { error: "Failed to reject request." };
  }

  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "rejectJoinRequest", userId: user.id, revalidated: ["/groups/[slug]"] });
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
    logger.info("server-action:complete", { action: "inviteMember", userId: user.id, groupId, targetUserId: userId, revalidated: ["/groups/[slug]"] });
    return {};
  } catch (err) {
    logger.error("server-action:error", { action: "inviteMember", userId: user.id, groupId, error: String(err) });
    return { error: "Failed to invite member. They may already be in the group." };
  }
}

// ─── Group Notes ──────────────────────────────────────────────────────────────

export async function addGroupNoteAction(
  groupId: string,
  title: string,
  content: string,
): Promise<{ error?: string; noteId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("group_notes")
    .insert({ group_id: groupId, created_by: user.id, title: title.trim() || "Untitled Note", content })
    .select("id")
    .single();
  if (error) {
    logger.error("server-action:error", { action: "addGroupNote", userId: user.id, groupId, error: error.message });
    return { error: error.message };
  }
  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "addGroupNote", userId: user.id, groupId, noteId: data.id, revalidated: ["/groups/[slug]"] });
  return { noteId: data.id };
}

export async function updateGroupNoteAction(
  noteId: string,
  title: string,
  content: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_notes")
    .update({ title: title.trim() || "Untitled Note", content, updated_at: new Date().toISOString() })
    .eq("id", noteId);
  if (error) {
    logger.error("server-action:error", { action: "updateGroupNote", userId: user.id, noteId, error: error.message });
    return { error: error.message };
  }
  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "updateGroupNote", userId: user.id, noteId, revalidated: ["/groups/[slug]"] });
  return {};
}

export async function deleteGroupNoteAction(
  noteId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("group_notes")
    .delete()
    .eq("id", noteId);
  if (error) {
    logger.error("server-action:error", { action: "deleteGroupNote", userId: user.id, noteId, error: error.message });
    return { error: error.message };
  }
  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "deleteGroupNote", userId: user.id, noteId, revalidated: ["/groups/[slug]"] });
  return {};
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
    is_working_group?: boolean;
    slug?: string;
  }
): Promise<{ error?: string; newSlug?: string }> {
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

  // Only platform admins can set is_working_group
  if (settings.is_working_group !== undefined) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") {
      payload.is_working_group = settings.is_working_group;
    }
  }

  let newSlug: string | undefined;

  if (settings.slug !== undefined) {
    const normalized = normalizeSlug(settings.slug);
    if (!normalized) {
      return { error: "Slug can only use lowercase letters, numbers, and hyphens." };
    }
    const available = await isSlugAvailable(normalized, groupId);
    if (!available) {
      return { error: "This URL slug is already in use by another group." };
    }
    payload.slug = normalized;
    newSlug = normalized;
  }

  const { error } = await supabase
    .from("groups")
    .update(payload)
    .eq("id", groupId);

  if (error) {
    logger.error("server-action:error", { action: "updateGroupSettings", userId: user.id, groupId, error: error.message });
    return { error: "Failed to update settings." };
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/[slug]`, "page");
  logger.info("server-action:complete", { action: "updateGroupSettings", userId: user.id, groupId, revalidated: ["/groups", "/groups/[slug]"] });
  return newSlug !== undefined ? { newSlug } : {};
}
