import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Find an existing DM conversation between two users.
 * Returns the conversation ID or null if none exists.
 */
export async function findExistingDM(
  userId1: string,
  userId2: string
): Promise<string | null> {
  if (userId1 === userId2) return null;

  const supabase = await createClient();

  // Step 1: get all conversation IDs for user1
  const { data: user1Participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId1);

  if (!user1Participations || user1Participations.length === 0) return null;

  const user1ConvIds = user1Participations.map((p) => p.conversation_id);

  // Step 2: find conversations where user2 is also a participant
  const { data: sharedParticipations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId2)
    .in("conversation_id", user1ConvIds);

  if (!sharedParticipations || sharedParticipations.length === 0) return null;

  const sharedConvIds = sharedParticipations.map((p) => p.conversation_id);

  // Step 3: filter for DM type
  const { data: dmConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("type", "dm")
    .in("id", sharedConvIds)
    .limit(1)
    .maybeSingle();

  return dmConversation?.id ?? null;
}

/**
 * Create a new DM conversation between two users.
 * Returns the new conversation ID, or throws with the DB error message attached.
 */
export async function createDMConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  const supabase = await createClient();

  // Generate the ID server-side so we never need to SELECT the conversation
  // back after inserting — the SELECT policy requires at least one participant
  // to exist, creating an RLS chicken-and-egg problem if we insert then select.
  const conversationId = randomUUID();

  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, type: "dm" });

  if (convError) {
    throw new Error(
      `Failed to create conversation: ${convError.message} (code: ${convError.code})`
    );
  }

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversationId, user_id: userId1 },
      { conversation_id: conversationId, user_id: userId2 },
    ]);

  if (partError) {
    throw new Error(
      `Failed to add participants: ${partError.message} (code: ${partError.code})`
    );
  }

  return conversationId;
}
