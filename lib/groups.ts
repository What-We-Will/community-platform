import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { Group } from "@/lib/types";

/**
 * Converts a group name to a URL-friendly slug.
 * Appends a short random suffix if the slug is already taken.
 */
export async function generateSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  const supabase = await createClient();

  // Try the clean slug first
  const { data: existing } = await supabase
    .from("groups")
    .select("slug")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) return base;

  // Append a short random suffix
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/**
 * Creates a group with its own group conversation atomically.
 *
 * Delegates to the `create_group_transactional` PostgreSQL function (SECURITY
 * DEFINER) which runs all four inserts — conversation, group, group_members,
 * conversation_participants — inside a single transaction.  This avoids both
 * the RLS chicken-and-egg timing problems and orphaned rows from partial failures.
 */
export async function createGroup(
  name: string,
  description: string | null,
  slug: string,
  isPrivate: boolean,
  createdBy: string
): Promise<Group> {
  const supabase = await createClient();

  const conversationId = randomUUID();
  const groupId = randomUUID();

  const { error } = await supabase.rpc("create_group_transactional", {
    p_group_id: groupId,
    p_conversation_id: conversationId,
    p_name: name,
    p_description: description || null,
    p_slug: slug,
    p_is_private: isPrivate,
  });

  if (error) {
    throw new Error(`Failed to create group: ${error.message} (${error.code})`);
  }

  return {
    id: groupId,
    name,
    description: description || null,
    slug,
    avatar_url: null,
    is_private: isPrivate,
    max_members: null,
    created_by: createdBy,
    conversation_id: conversationId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Adds a user to a group and its conversation.
 * Also posts a "{display_name} joined the group" system message.
 */
export async function joinGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // Fetch group to get conversation_id and validate existence
  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .select("id, name, conversation_id")
    .eq("id", groupId)
    .single();

  if (groupErr || !group) {
    throw new Error(`Group not found: ${groupErr?.message}`);
  }

  // Insert group member (23505 = already a member → treat as success)
  const { error: memberErr } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });

  if (memberErr && memberErr.code !== "23505") {
    throw new Error(`Failed to join group: ${memberErr.message}`);
  }

  // Add to conversation participants
  if (group.conversation_id) {
    const { error: partErr } = await supabase
      .from("conversation_participants")
      .insert({ conversation_id: group.conversation_id, user_id: userId });

    if (partErr && partErr.code !== "23505") {
      throw new Error(`Failed to add to conversation: ${partErr.message}`);
    }
  }

  // Post system message
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  if (group.conversation_id && profile) {
    await supabase.from("messages").insert({
      conversation_id: group.conversation_id,
      sender_id: null,
      content: `${profile.display_name} joined the group`,
      message_type: "system",
    });
  }
}

/**
 * Removes a user from a group and its conversation.
 * Posts a "{display_name} left the group" system message.
 * Prevents the last admin from leaving.
 * Returns an error string if the operation cannot proceed, null on success.
 */
export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<string | null> {
  const supabase = await createClient();

  // Fetch group
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, conversation_id")
    .eq("id", groupId)
    .single();

  if (!group) return "Group not found";

  // Check if this user is the last admin
  const { data: admins } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("role", "admin");

  const isLastAdmin =
    admins?.length === 1 && admins[0].user_id === userId;

  if (isLastAdmin) {
    return "You are the last admin. Transfer admin to another member before leaving.";
  }

  // Fetch display name for system message before deleting
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  // Post system message before removal (while still a participant)
  if (group.conversation_id && profile) {
    await supabase.from("messages").insert({
      conversation_id: group.conversation_id,
      sender_id: null,
      content: `${profile.display_name} left the group`,
      message_type: "system",
    });
  }

  // Remove from group_members
  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  // Remove from conversation_participants
  if (group.conversation_id) {
    await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", group.conversation_id)
      .eq("user_id", userId);
  }

  return null;
}
