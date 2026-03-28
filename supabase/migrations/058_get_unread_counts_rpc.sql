-- M6-T01: RPC to batch unread message counts across multiple conversations.
-- Replaces per-conversation N+1 queries in fetchRecentConversations and MyGroupsCard.
-- Returns one row per conversation that has unread messages (conversations with 0 unread are omitted).
-- Matches existing behavior: if last_read_at is NULL, unread count is 0 (no row returned).

CREATE OR REPLACE FUNCTION get_unread_counts(
  p_user_id UUID,
  p_conversation_ids UUID[]
)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT) AS $$
  SELECT m.conversation_id, COUNT(*)::BIGINT
  FROM messages m
  JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id
    AND cp.user_id = p_user_id
  WHERE m.conversation_id = ANY(p_conversation_ids)
    AND m.sender_id != p_user_id
    AND cp.last_read_at IS NOT NULL
    AND m.created_at > cp.last_read_at
  GROUP BY m.conversation_id
$$ LANGUAGE sql STABLE;
