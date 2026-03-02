import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  // Fetch the conversation to determine type
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type, group_id, created_at")
    .eq("id", conversationId)
    .single();

  if (!conversation) redirect("/messages");

  // Fetch current user's profile
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const currentUser = {
    id: user.id,
    display_name: currentUserProfile?.display_name ?? "You",
    avatar_url: currentUserProfile?.avatar_url ?? null,
  };

  // ── Group conversation ────────────────────────────────────────────────────
  if (conversation.type === "group") {
    // Fetch group info
    const { data: group } = await supabase
      .from("groups")
      .select("id, name, slug")
      .eq("conversation_id", conversationId)
      .single();

    // Fetch all participants with profiles
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const participantIds = allParticipants?.map((p) => p.user_id) ?? [];
    const memberCount = participantIds.length;

    const { data: profilesData } = participantIds.length
      ? await supabase.from("profiles").select("*").in("id", participantIds)
      : { data: [] };

    const participants = (profilesData ?? []) as Profile[];

    // Build profile cache for messages
    const profileCache = new Map<string, Profile>(
      participants.map((p) => [p.id, p])
    );

    const { data: rawMessages } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, message_type, metadata, edited_at, created_at"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(50);

    const messages: MessageWithSender[] = (rawMessages ?? [])
      .reverse()
      .map((msg) => ({
        ...msg,
        message_type: msg.message_type as MessageWithSender["message_type"],
        metadata: (msg.metadata ?? {}) as Record<string, unknown>,
        sender: msg.sender_id ? (profileCache.get(msg.sender_id) ?? null) : null,
      }));

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background md:static md:flex-1 md:z-auto">
        <ConversationView
          conversationId={conversationId}
          currentUser={currentUser}
          isGroup
          groupName={group?.name ?? "Group"}
          groupSlug={group?.slug}
          memberCount={memberCount}
          participants={participants}
          initialMessages={messages}
        />
      </div>
    );
  }

  // ── DM conversation ───────────────────────────────────────────────────────
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
    redirect("/messages");
  }

  const { data: rawMessages } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, message_type, metadata, edited_at, created_at"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

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

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  return (
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
