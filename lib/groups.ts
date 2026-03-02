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
 * Creates a group with its own group conversation.
 * Order of operations avoids circular FK dependencies:
 *   1. Insert conversation (type='group', group_id=null)
 *   2. Insert group (conversation_id = that conversation)
 *   3. Update group.conversation_id on conversation row isn't needed —
 *      we look up the group via groups.conversation_id everywhere
 *   4. Add creator to group_members as admin
 *   5. Add creator to conversation_participants
 */
export async function createGroup(
  name: string,
  description: string | null,
  slug: string,
  isPrivate: boolean,
  createdBy: string
): Promise<Group> {
  const supabase = await createClient();

  // 1. Create the group conversation
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({ type: "group" })
    .select("id")
    .single();

  if (convErr || !conv) {
    throw new Error(`Failed to create conversation: ${convErr?.message}`);
  }

  // 2. Create the group
  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .insert({
      name,
      description: description || null,
      slug,
      is_private: isPrivate,
      created_by: createdBy,
      conversation_id: conv.id,
    })
    .select("*")
    .single();

  if (groupErr || !group) {
    throw new Error(`Failed to create group: ${groupErr?.message}`);
  }

  // 3. Add creator as admin member
  const { error: memberErr } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: createdBy, role: "admin" });

  if (memberErr) {
    throw new Error(`Failed to add creator as member: ${memberErr.message}`);
  }

  // 4. Add creator to the conversation
  const { error: participantErr } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, user_id: createdBy });

  if (participantErr) {
    throw new Error(`Failed to add participant: ${participantErr.message}`);
  }

  return group as Group;
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
