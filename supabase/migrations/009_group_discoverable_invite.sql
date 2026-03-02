-- ─── is_discoverable column ───────────────────────────────────────────────────
-- When true, private groups appear in the discovery page (lock icon shown).
-- Visitors can see them and submit a join request.
-- When false, the group is completely hidden unless you have a direct link or
-- receive an invitation from an admin.

ALTER TABLE public.groups ADD COLUMN is_discoverable BOOLEAN NOT NULL DEFAULT true;

-- Policy: discoverable private groups are visible to all authenticated users
-- (so they show up in the discovery page even for non-members)
CREATE POLICY "Anyone can view discoverable private groups" ON public.groups
  FOR SELECT TO authenticated
  USING (is_private = true AND is_discoverable = true);

-- ─── Update create_group_transactional to accept is_discoverable ──────────────

CREATE OR REPLACE FUNCTION public.create_group_transactional(
  p_group_id         uuid,
  p_conversation_id  uuid,
  p_name             text,
  p_description      text,
  p_slug             text,
  p_is_private       boolean,
  p_is_discoverable  boolean DEFAULT true
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

  INSERT INTO public.groups
    (id, name, description, slug, is_private, is_discoverable, created_by, conversation_id)
    VALUES
    (p_group_id, p_name, p_description, p_slug, p_is_private, p_is_discoverable, v_creator, p_conversation_id);

  INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (p_group_id, v_creator, 'admin');

  INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (p_conversation_id, v_creator);
END;
$$;

-- ─── Allow admins to add (invite) other users directly ────────────────────────
-- The existing "Group admins can manage members" FOR ALL policy already covers
-- INSERT when the admin is inserting a different user_id (it only checks
-- group_id, not user_id).  No new policy is needed for group_members.
--
-- For conversation_participants the existing WITH CHECK (true) policy applies.
-- Nothing to add there either.
