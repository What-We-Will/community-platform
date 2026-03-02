"use server";

import { createClient } from "@/lib/supabase/server";
import { findExistingDM, createDMConversation } from "@/lib/messages";

/**
 * Find an existing DM with targetUserId, or create one.
 * Returns the conversation ID, or null on failure.
 */
export async function getOrCreateDM(
  targetUserId: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (user.id === targetUserId) return null;

  try {
    let conversationId = await findExistingDM(user.id, targetUserId);
    if (!conversationId) {
      conversationId = await createDMConversation(user.id, targetUserId);
    }
    return conversationId;
  } catch (err) {
    console.error("[getOrCreateDM] failed:", err);
    return null;
  }
}
