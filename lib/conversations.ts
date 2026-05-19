import { createClient } from "@/lib/supabase/server";
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  Profile,
} from "@/lib/types";

/**
 * Fetches conversations the user participates in, with last message and unread counts.
 * Sorted by last message created_at descending, limited to `limit` results.
 */
export async function fetchRecentConversations(
  userId: string,
  limit: number = 5
): Promise<ConversationWithDetails[]> {
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId)
    .eq("archived", false);

  const conversations: ConversationWithDetails[] = [];

  if (!participations || participations.length === 0) {
    return conversations;
  }

  const conversationIds = participations.map((p) => p.conversation_id);

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, type, group_id, created_at")
    .in("id", conversationIds);

  if (!convs || convs.length === 0) {
    return conversations;
  }

  const dmConvs = convs.filter((c) => c.type === "dm");
  const groupConvs = convs.filter((c) => c.type === "group");
  const allConvIds = convs.map((c) => c.id);

  // Two RPCs in parallel: one returns exactly one (most recent) message per
  // conversation via DISTINCT ON; the other returns unread counts. Both
  // enforce participant membership server-side.
  const [lastMsgsResult, unreadsResult] = await Promise.all([
    supabase.rpc("get_last_messages", {
      p_conversation_ids: allConvIds,
    }),
    supabase.rpc("get_unread_counts", {
      p_conversation_ids: allConvIds,
    }),
  ]);

  const lastMsgMap = new Map<string, Message>();
  for (const msg of (lastMsgsResult.data ?? []) as Message[]) {
    lastMsgMap.set(msg.conversation_id, msg);
  }

  const unreadMap = new Map<string, number>();
  for (const row of (unreadsResult.data ?? []) as Array<{
    conversation_id: string;
    unread_count: number | string;
  }>) {
    unreadMap.set(row.conversation_id, Number(row.unread_count));
  }

  if (dmConvs.length > 0) {
    const dmConvIds = dmConvs.map((c) => c.id);

    const { data: allOtherParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", dmConvIds)
      .neq("user_id", userId);

    const otherUserIds = [
      ...new Set(allOtherParticipants?.map((p) => p.user_id) ?? []),
    ];
    const { data: allProfiles } =
      otherUserIds.length > 0
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

    for (const conv of dmConvs) {
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

  if (groupConvs.length > 0) {
    const groupConvIds = groupConvs.map((c) => c.id);

    const { data: groups } = await supabase
      .from("groups")
      .select("id, name, slug, conversation_id, archived")
      .in("conversation_id", groupConvIds);

    const groupByConvId = new Map(
      (groups ?? [])
        .filter((g) => !(g as { archived?: boolean }).archived)
        .map((g) => [g.conversation_id as string, g])
    );

    for (const conv of groupConvs) {
      const group = groupByConvId.get(conv.id);
      if (!group) continue;
      conversations.push({
        conversation: conv as Conversation,
        participants: [],
        lastMessage: lastMsgMap.get(conv.id) ?? null,
        unreadCount: unreadMap.get(conv.id) ?? 0,
        groupName: group?.name,
        groupSlug: group?.slug,
      });
    }
  }

  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.created_at ?? a.conversation.created_at;
    const bTime = b.lastMessage?.created_at ?? b.conversation.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return conversations.slice(0, limit);
}
