-- Batched messaging RPCs for issue #91.

CREATE OR REPLACE FUNCTION public.get_unread_counts(
  p_conversation_ids uuid[]
)
RETURNS TABLE(conversation_id uuid, unread_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
    SELECT m.conversation_id, COUNT(*)::bigint AS unread_count
    FROM public.messages m
    JOIN public.conversation_participants cp
      ON cp.conversation_id = m.conversation_id
      AND cp.user_id = v_user_id
      AND cp.archived = false
    WHERE m.conversation_id = ANY(p_conversation_ids)
      AND m.sender_id <> v_user_id
      AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    GROUP BY m.conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_counts(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_unread_counts(uuid[]) IS
  'Per-conversation unread counts for the calling user. '
  'Conversations with zero unread are omitted.';


CREATE OR REPLACE FUNCTION public.get_last_messages(
  p_conversation_ids uuid[]
)
RETURNS TABLE(
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  content text,
  message_type text,
  metadata jsonb,
  edited_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
    SELECT DISTINCT ON (m.conversation_id)
      m.id,
      m.conversation_id,
      m.sender_id,
      m.content,
      m.message_type,
      m.metadata,
      m.edited_at,
      m.created_at
    FROM public.messages m
    JOIN public.conversation_participants cp
      ON cp.conversation_id = m.conversation_id
      AND cp.user_id = v_user_id
      AND cp.archived = false
    WHERE m.conversation_id = ANY(p_conversation_ids)
    ORDER BY m.conversation_id, m.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_last_messages(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_last_messages(uuid[]) IS
  'Most recent message per conversation for the calling user.';


CREATE OR REPLACE FUNCTION public.get_total_unread_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*)::bigint INTO v_total
  FROM public.messages m
  JOIN public.conversation_participants cp
    ON cp.conversation_id = m.conversation_id
    AND cp.user_id = v_user_id
    AND cp.archived = false
  WHERE m.sender_id <> v_user_id
    AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);

  RETURN COALESCE(v_total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_unread_count() TO authenticated;

COMMENT ON FUNCTION public.get_total_unread_count() IS
  'Total unread message count for the calling user across non-archived participations.';
