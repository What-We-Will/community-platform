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
 * Returns the new conversation ID.
 */
export async function createDMConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  const supabase = await createClient();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({ type: "dm" })
    .select()
    .single();

  if (convError || !conversation) {
    throw new Error("Failed to create conversation");
  }

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: userId1 },
      { conversation_id: conversation.id, user_id: userId2 },
    ]);

  if (partError) throw new Error("Failed to add participants");

  return conversation.id;
}
