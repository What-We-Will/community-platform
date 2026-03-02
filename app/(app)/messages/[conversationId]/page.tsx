import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ConversationView } from "@/components/messages/ConversationView";
import type { MessageWithSender, Profile } from "@/lib/types";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify current user is a participant
  const { data: myParticipation, error: myParticipationError } = await supabase
    .from("conversation_participants")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (myParticipationError) {
    console.error("[conversation] myParticipation error:", myParticipationError);
  }

  if (!myParticipation) {
    console.error("[conversation] user", user.id, "is not a participant in", conversationId);
    redirect("/messages");
  }

  // Fetch the other participant's profile
  const { data: otherParticipant, error: otherParticipantError } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id)
    .maybeSingle();

  if (otherParticipantError) {
    console.error("[conversation] otherParticipant error:", otherParticipantError);
  }

  if (!otherParticipant) {
    console.error("[conversation] no other participant found in", conversationId);
    redirect("/messages");
  }

  const { data: otherUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherParticipant.user_id)
    .single();

  if (!otherUserProfile) {
    console.error("[conversation] other user profile not found:", otherParticipant.user_id);
    notFound();
  }

  // Fetch current user's profile (needed for message bubbles)
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch the 50 most recent messages with sender info
  const { data: rawMessages } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, message_type, metadata, edited_at, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Reverse to chronological order and enrich with sender profiles
  const profileCache = new Map<string, Profile>([
    [user.id, currentUserProfile as Profile],
    [otherParticipant.user_id, otherUserProfile as Profile],
  ]);

  const messages: MessageWithSender[] = (rawMessages ?? [])
    .reverse()
    .map((msg) => ({
      ...msg,
      message_type: msg.message_type as MessageWithSender["message_type"],
      metadata: (msg.metadata ?? {}) as Record<string, unknown>,
      sender: msg.sender_id ? (profileCache.get(msg.sender_id) ?? null) : null,
    }));

  // Mark as read
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  const currentUser = {
    id: user.id,
    display_name: currentUserProfile?.display_name ?? "You",
    avatar_url: currentUserProfile?.avatar_url ?? null,
  };

  return (
    /*
     * On mobile: fixed full-screen overlay (z-40 sits above the mobile header at z-30).
     * On md+: static, filling the right panel of the messages layout.
     */
    <div className="fixed inset-0 z-40 flex flex-col bg-background md:static md:flex-1 md:z-auto">
      <ConversationView
        conversationId={conversationId}
        currentUser={currentUser}
        otherUser={otherUserProfile as Profile}
        initialMessages={messages}
      />
    </div>
  );
}
