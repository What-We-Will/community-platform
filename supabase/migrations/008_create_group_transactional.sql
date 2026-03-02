-- Replaces the multi-step createGroup() JS function with a single atomic
-- PostgreSQL function.  Because all four inserts run in the same transaction,
-- either everything succeeds or nothing is committed — no more orphaned group
-- rows with 0 members.
--
-- SECURITY DEFINER lets the function run as the DB owner (bypassing RLS) so
-- it doesn't hit the chicken-and-egg timing problems where RLS policies on
-- groups/group_members/conversation_participants reference each other before
-- the rows exist.  auth.uid() still identifies the calling user.

CREATE OR REPLACE FUNCTION public.create_group_transactional(
  p_group_id         uuid,
  p_conversation_id  uuid,
  p_name             text,
  p_description      text,
  p_slug             text,
  p_is_private       boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator uuid := auth.uid();
BEGIN
  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.conversations (id, type)
    VALUES (p_conversation_id, 'group');

  INSERT INTO public.groups (id, name, description, slug, is_private, created_by, conversation_id)
    VALUES (p_group_id, p_name, p_description, p_slug, p_is_private, v_creator, p_conversation_id);

  INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (p_group_id, v_creator, 'admin');

  INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (p_conversation_id, v_creator);
END;
$$;

-- Also clean up any orphaned groups that have no members (created during the
-- broken multi-step period before this migration).
DELETE FROM public.groups
WHERE id NOT IN (SELECT DISTINCT group_id FROM public.group_members);
