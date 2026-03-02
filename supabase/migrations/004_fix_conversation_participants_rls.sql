-- conversation_participants had a self-referential SELECT policy:
--   USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()))
--
-- PostgreSQL applies RLS to every table reference in a policy expression,
-- including the inner sub-SELECT on the same table.  This creates infinite
-- recursion; Supabase silently returns 0 rows, making every participant
-- lookup fail even after a successful INSERT.
--
-- Fix: wrap the inner look-up in a SECURITY DEFINER function.  SECURITY
-- DEFINER functions run as the function owner (postgres), which bypasses
-- RLS on the inner query and breaks the recursion.

CREATE OR REPLACE FUNCTION public.get_my_conversation_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT conversation_id
  FROM public.conversation_participants
  WHERE user_id = auth.uid();
$$;

-- Rebuild the participant visibility policy using the helper.
DROP POLICY IF EXISTS "Users can view participants of their conversations"
  ON public.conversation_participants;

CREATE POLICY "Users can view participants of their conversations"
  ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );
