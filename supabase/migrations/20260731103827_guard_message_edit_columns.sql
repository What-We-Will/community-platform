-- Column-level protection for public.messages, enabling member message editing.
--
-- The UPDATE RLS policy on messages ("Users can edit their own messages") is
-- row-scoped (sender_id = auth.uid()) but not column-scoped, so an authenticated
-- member can PATCH their own message directly against PostgREST and rewrite
-- created_at, message_type, or metadata — or change content while leaving
-- edited_at NULL, erasing the edit trace. Postgres WITH CHECK cannot compare
-- against OLD, so a BEFORE UPDATE trigger enforces the column-level rule.
--
-- Follows the pattern established for profiles in
-- 20260721134035_protect_profiles_role_columns.sql.

CREATE OR REPLACE FUNCTION public.guard_message_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Privileged connections bypass the guard: service_role (server-side admin
  -- flows) and direct superuser/admin DB connections (migrations, seeds). A
  -- normal request runs as the 'authenticated' role and is never any of these.
  -- SECURITY INVOKER (the default) is required so that current_user reflects
  -- the real caller, not the function owner.
  IF current_user IN ('service_role', 'supabase_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  -- Identity and provenance are immutable. Rewriting any of these would let a
  -- member reattribute, relocate, or backdate a message.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'permission denied: id is not editable';
  END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'permission denied: conversation_id is not editable';
  END IF;
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'permission denied: sender_id is not editable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'permission denied: created_at is not editable';
  END IF;
  IF NEW.message_type IS DISTINCT FROM OLD.message_type THEN
    RAISE EXCEPTION 'permission denied: message_type is not editable';
  END IF;
  IF NEW.metadata IS DISTINCT FROM OLD.metadata THEN
    RAISE EXCEPTION 'permission denied: metadata is not editable';
  END IF;

  -- Only plain text messages are editable. System messages, video invites, and
  -- file attachments carry meaning in metadata that content alone cannot
  -- represent, so editing them coherently is not possible.
  IF OLD.message_type <> 'text' THEN
    RAISE EXCEPTION 'permission denied: only text messages can be edited';
  END IF;

  -- An edit cannot empty a message. Removal is deletion, which is a separate
  -- feature with different semantics (see the message-deletion issue).
  IF NEW.content IS NULL OR btrim(NEW.content) = '' THEN
    RAISE EXCEPTION 'message content cannot be empty';
  END IF;

  -- edited_at is stamped server-side and is never client-supplied. Setting it
  -- only when content actually changed keeps the marker honest: a no-op write
  -- does not flag a message as edited, and a real edit cannot avoid the flag.
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.edited_at := now();
  ELSE
    NEW.edited_at := OLD.edited_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_message_edit_columns
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_message_edit();
