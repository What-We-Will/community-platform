import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  Profile,
} from "@/lib/types";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Fetch participations ──────────────────────────────────────────────────
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  const conversations: ConversationWithDetails[] = [];

  if (participations && participations.length > 0) {
    const conversationIds = participations.map((p) => p.conversation_id);

    // Batch: all DM conversations
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, type, group_id, created_at")
      .in("id", conversationIds)
      .eq("type", "dm");

    if (convs && convs.length > 0) {
      const convIds = convs.map((c) => c.id);

      // Batch: all other participants in one query
      const { data: allOtherParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds)
        .neq("user_id", user.id);

      // Batch: all profiles
      const otherUserIds = [
        ...new Set(allOtherParticipants?.map((p) => p.user_id) ?? []),
      ];
      const { data: allProfiles } = otherUserIds.length
        ? await supabase.from("profiles").select("*").in("id", otherUserIds)
        : { data: [] };

      // Build lookup maps
      const profileMap = new Map(
        (allProfiles ?? []).map((p) => [p.id, p as Profile])
      );
      const participantMap = new Map<string, string[]>();
      for (const p of allOtherParticipants ?? []) {
        const arr = participantMap.get(p.conversation_id) ?? [];
        arr.push(p.user_id);
        participantMap.set(p.conversation_id, arr);
      }

      // Parallel: last message + unread count per conversation
      const [lastMsgsResults, unreadResults] = await Promise.all([
        Promise.all(
          convIds.map(async (cid) => {
            const { data } = await supabase
              .from("messages")
              .select(
                "id, conversation_id, sender_id, content, message_type, metadata, edited_at, created_at"
              )
              .eq("conversation_id", cid)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            return { cid, msg: data as Message | null };
          })
        ),
        Promise.all(
          convIds.map(async (cid) => {
            const participation = participations.find(
              (p) => p.conversation_id === cid
            );
            if (!participation?.last_read_at) return { cid, count: 0 };
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", cid)
              .neq("sender_id", user.id)
              .gt("created_at", participation.last_read_at);
            return { cid, count: count ?? 0 };
          })
        ),
      ]);

      const lastMsgMap = new Map(
        lastMsgsResults.map(({ cid, msg }) => [cid, msg])
      );
      const unreadMap = new Map(
        unreadResults.map(({ cid, count }) => [cid, count])
      );

      for (const conv of convs) {
        const participantIds = participantMap.get(conv.id) ?? [];
        const participants = participantIds
          .map((id) => profileMap.get(id))
          .filter(Boolean) as Profile[];

        conversations.push({
          conversation: conv as Conversation,
          participants,
          lastMessage: lastMsgMap.get(conv.id) ?? null,
          unreadCount: unreadMap.get(conv.id) ?? 0,
        });
      }
    }
  }

  // Sort newest-activity first
  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.created_at ?? a.conversation.created_at;
    const bTime = b.lastMessage?.created_at ?? b.conversation.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    // Counteract AppShell's p-4 lg:p-6, fill the remaining viewport height
    <div className="-m-4 lg:-m-6 flex h-[calc(100dvh-3.5rem)] overflow-hidden lg:h-dvh">
      {/* Left: conversation list — full-width on mobile, 320 px on desktop */}
      <div className="flex w-full shrink-0 flex-col border-r md:w-80">
        <ConversationList
          initialConversations={conversations}
          currentUserId={user.id}
        />
      </div>

      {/* Right: page content — hidden on mobile (conversation page overlays), flex on desktop */}
      <div className="hidden flex-1 flex-col min-w-0 md:flex">{children}</div>
    </div>
  );
}
