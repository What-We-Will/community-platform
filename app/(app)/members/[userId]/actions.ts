"use server";

import { createClient } from "@/lib/supabase/server";
import { findExistingDM, createDMConversation } from "@/lib/messages";
import { getVideoRoomName } from "@/lib/utils/video";

export async function startQuickCall(targetUserId: string): Promise<{
  conversationId?: string;
  roomName?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === targetUserId) return { error: "Cannot call yourself" };

  try {
    let conversationId = await findExistingDM(user.id, targetUserId);
    if (!conversationId) {
      conversationId = await createDMConversation(user.id, targetUserId);
    }

    const roomName = getVideoRoomName({ type: "dm", id: conversationId });

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name ?? "Someone";

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: `${displayName} started a video call`,
      message_type: "video_invite",
      metadata: {
        room_name: roomName,
        started_by: displayName,
      },
    });

    return { conversationId, roomName };
  } catch (err) {
    console.error("[startQuickCall]", err);
    return {
      error: err instanceof Error ? err.message : "Failed to start call",
    };
  }
}

export async function endQuickCall(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: null,
    content: "Video call ended",
    message_type: "system",
  });
}
