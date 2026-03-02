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

  // ── Fetch all participations ──────────────────────────────────────────────
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  const conversations: ConversationWithDetails[] = [];

  if (participations && participations.length > 0) {
    const conversationIds = participations.map((p) => p.conversation_id);

    // Fetch ALL conversation types (dm + group)
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, type, group_id, created_at")
      .in("id", conversationIds);

    if (convs && convs.length > 0) {
      const dmConvs = convs.filter((c) => c.type === "dm");
      const groupConvs = convs.filter((c) => c.type === "group");

      // ── DMs ──────────────────────────────────────────────────────────────
      if (dmConvs.length > 0) {
        const dmConvIds = dmConvs.map((c) => c.id);

        const { data: allOtherParticipants } = await supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", dmConvIds)
          .neq("user_id", user.id);

        const otherUserIds = [
          ...new Set(allOtherParticipants?.map((p) => p.user_id) ?? []),
        ];
        const { data: allProfiles } = otherUserIds.length
          ? await supabase.from("profiles").select("*").in("id", otherUserIds)
          : { data: [] };

        const profileMap = new Map(
          (allProfiles ?? []).map((p) => [p.id, p as Profile])
        );
        const participantMap = new Map<string, string[]>();
        for (const p of allOtherParticipants ?? []) {
          const arr = participantMap.get(p.conversation_id) ?? [];
          arr.push(p.user_id);
          participantMap.set(p.conversation_id, arr);
        }

        const [dmLastMsgs, dmUnreads] = await Promise.all([
          Promise.all(
            dmConvIds.map(async (cid) => {
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
            dmConvIds.map(async (cid) => {
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

        const dmLastMsgMap = new Map(
          dmLastMsgs.map(({ cid, msg }) => [cid, msg])
        );
        const dmUnreadMap = new Map(
          dmUnreads.map(({ cid, count }) => [cid, count])
        );

        for (const conv of dmConvs) {
          const participantIds = participantMap.get(conv.id) ?? [];
          const participants = participantIds
            .map((id) => profileMap.get(id))
            .filter(Boolean) as Profile[];

          conversations.push({
            conversation: conv as Conversation,
            participants,
            lastMessage: dmLastMsgMap.get(conv.id) ?? null,
            unreadCount: dmUnreadMap.get(conv.id) ?? 0,
          });
        }
      }

      // ── Group conversations ───────────────────────────────────────────────
      if (groupConvs.length > 0) {
        const groupConvIds = groupConvs.map((c) => c.id);

        // Look up group details by conversation_id (exclude archived)
        const { data: groups } = await supabase
          .from("groups")
          .select("id, name, slug, conversation_id, archived")
          .in("conversation_id", groupConvIds);

        const groupByConvId = new Map(
          (groups ?? [])
            .filter((g) => !(g as { archived?: boolean }).archived)
            .map((g) => [g.conversation_id as string, g])
        );

        const [groupLastMsgs, groupUnreads] = await Promise.all([
          Promise.all(
            groupConvIds.map(async (cid) => {
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
            groupConvIds.map(async (cid) => {
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

        const groupLastMsgMap = new Map(
          groupLastMsgs.map(({ cid, msg }) => [cid, msg])
        );
        const groupUnreadMap = new Map(
          groupUnreads.map(({ cid, count }) => [cid, count])
        );

        for (const conv of groupConvs) {
          const group = groupByConvId.get(conv.id);
          if (!group) continue; // skip archived groups (filtered out above)
          conversations.push({
            conversation: conv as Conversation,
            participants: [],
            lastMessage: groupLastMsgMap.get(conv.id) ?? null,
            unreadCount: groupUnreadMap.get(conv.id) ?? 0,
            groupName: group?.name,
            groupSlug: group?.slug,
          });
        }
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
    <div className="-m-4 lg:-m-6 flex h-[calc(100dvh-3.5rem)] overflow-hidden lg:h-dvh">
      <div className="flex w-full shrink-0 flex-col border-r md:w-80">
        <ConversationList
          initialConversations={conversations}
          currentUserId={user.id}
        />
      </div>
      <div className="hidden flex-1 flex-col min-w-0 md:flex">{children}</div>
    </div>
  );
}
