import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Generates a stable UUID for a DM between two users.
 * Sorting ensures deterministism regardless of argument order.
 * Format matches UUID v5 conventions (version nibble = 5, variant = 8x).
 */
function dmConversationId(userId1: string, userId2: string): string {
  const [a, b] = [userId1, userId2].sort();
  const hash = createHash("sha256").update(`dm:${a}:${b}`).digest("hex");
  // Format as xxxxxxxx-xxxx-5xxx-8xxx-xxxxxxxxxxxx
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "5" + hash.slice(13, 16),
    (parseInt(hash.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, "0") + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Generates a stable UUID for a user's self-notes conversation.
 * Uses a different namespace than DMs so it never collides.
 */
export function selfNotesConversationId(userId: string): string {
  const hash = createHash("sha256").update(`notes:${userId}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "5" + hash.slice(13, 16),
    (parseInt(hash.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, "0") + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Find or create a user's self-notes conversation.
 * Returns the conversation ID.
 */
export async function getOrCreateSelfNotes(userId: string): Promise<string> {
  const supabase = await createClient();
  const conversationId = selfNotesConversationId(userId);

  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, type: "dm" });

  if (convError && convError.code !== "23505") {
    throw new Error(`Failed to create notes conversation: ${convError.message}`);
  }

  // Only one participant — the user themselves
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conversationId, user_id: userId });

  if (partError && partError.code !== "23505") {
    throw new Error(`Failed to add participant: ${partError.message}`);
  }

  return conversationId;
}

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
 * Find or create a DM conversation between two users.
 * Uses a deterministic conversation ID derived from the sorted user pair, so
 * the database PRIMARY KEY constraint itself enforces uniqueness — two calls
 * for the same pair always resolve to the same conversation.
 */
export async function createDMConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  const supabase = await createClient();

  // Deterministic ID: same pair always produces the same UUID regardless of
  // argument order. If the row already exists, the INSERT returns a 23505
  // (unique_violation) error which we treat as a success.
  const conversationId = dmConversationId(userId1, userId2);

  const { error: convError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, type: "dm" });

  if (convError && convError.code !== "23505") {
    throw new Error(
      `Failed to create conversation: ${convError.message} (code: ${convError.code})`
    );
  }

  // Insert participants — ignore 23505 in case they were already added
  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversationId, user_id: userId1 },
      { conversation_id: conversationId, user_id: userId2 },
    ]);

  if (partError && partError.code !== "23505") {
    throw new Error(
      `Failed to add participants: ${partError.message} (code: ${partError.code})`
    );
  }

  return conversationId;
}
