-- Upgrade lightweight learning study groups into full Groups with chat,
-- a shared group calendar (events), and shared notes.

-- ── 1. Add is_study_group flag to groups ─────────────────────────────────────
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_study_group BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Link learning_study_groups to the real group row ──────────────────────
ALTER TABLE learning_study_groups
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- ── 3. Shared notes for any group ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled Note',
  content     TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE group_notes ENABLE ROW LEVEL SECURITY;

-- Group members can read notes
CREATE POLICY "gn_select" ON group_notes FOR SELECT TO authenticated
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Group members can create notes
CREATE POLICY "gn_insert" ON group_notes FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Note author or platform admin can update
CREATE POLICY "gn_update" ON group_notes FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Note author or platform admin can delete
CREATE POLICY "gn_delete" ON group_notes FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ── 4. Update the transactional group-creation RPC to support is_study_group ─
CREATE OR REPLACE FUNCTION public.create_group_transactional(
  p_group_id         uuid,
  p_conversation_id  uuid,
  p_name             text,
  p_description      text,
  p_slug             text,
  p_is_private       boolean,
  p_is_discoverable  boolean DEFAULT true,
  p_is_study_group   boolean DEFAULT false
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
    (id, name, description, slug, is_private, is_discoverable, is_study_group, created_by, conversation_id)
    VALUES
    (p_group_id, p_name, p_description, p_slug, p_is_private, p_is_discoverable, p_is_study_group, v_creator, p_conversation_id);

  INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (p_group_id, v_creator, 'admin');

  INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (p_conversation_id, v_creator);
END;
$$;
