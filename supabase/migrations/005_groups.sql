-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  max_members INT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_groups_slug ON public.groups(slug);

CREATE TABLE public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- ─── SECURITY DEFINER helpers (must come after tables) ────────────────────────
-- These run as the function owner (bypassing RLS) to break recursive
-- self-referential policy evaluation on group_members.

CREATE OR REPLACE FUNCTION public.get_my_group_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_group_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'admin';
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- groups: anyone can view public groups
CREATE POLICY "Anyone can view public groups" ON public.groups
  FOR SELECT TO authenticated USING (is_private = false);

-- groups: members can view private groups
CREATE POLICY "Members can view private groups" ON public.groups
  FOR SELECT TO authenticated USING (
    is_private = true AND id IN (SELECT public.get_my_group_ids())
  );

-- groups: authenticated users can create
CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- groups: admins can update; creator can also update (for setting conversation_id)
CREATE POLICY "Group admins can update their group" ON public.groups
  FOR UPDATE TO authenticated
  USING (id IN (SELECT public.get_my_admin_group_ids()) OR created_by = auth.uid())
  WITH CHECK (id IN (SELECT public.get_my_admin_group_ids()) OR created_by = auth.uid());

-- groups: admins can delete
CREATE POLICY "Group admins can delete their group" ON public.groups
  FOR DELETE TO authenticated USING (
    id IN (SELECT public.get_my_admin_group_ids())
  );

-- group_members: public group members visible to all authenticated users
CREATE POLICY "Anyone can view public group members" ON public.group_members
  FOR SELECT TO authenticated USING (
    group_id IN (SELECT id FROM public.groups WHERE is_private = false)
  );

-- group_members: private group members visible to fellow members
CREATE POLICY "Members can view private group members" ON public.group_members
  FOR SELECT TO authenticated USING (
    group_id IN (SELECT public.get_my_group_ids())
  );

-- group_members: users can join public groups (self-insert only)
CREATE POLICY "Users can join public groups" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (SELECT id FROM public.groups WHERE is_private = false)
  );

-- group_members: group creator can add themselves as first admin member
CREATE POLICY "Creators can add themselves as admin" ON public.group_members
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );

-- group_members: admins can add/update/remove other members
CREATE POLICY "Group admins can manage members" ON public.group_members
  FOR ALL TO authenticated
  USING (group_id IN (SELECT public.get_my_admin_group_ids()))
  WITH CHECK (group_id IN (SELECT public.get_my_admin_group_ids()));

-- group_members: users can leave (delete own row)
CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ─── conversation_participants: add DELETE policies (needed for leave) ────────

CREATE POLICY "Users can leave conversations" ON public.conversation_participants
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Group admins can remove participants from group conversations"
  ON public.conversation_participants
  FOR DELETE TO authenticated USING (
    conversation_id IN (
      SELECT g.conversation_id
      FROM public.groups g
      WHERE g.id IN (SELECT public.get_my_admin_group_ids())
        AND g.conversation_id IS NOT NULL
    )
  );

-- ─── messages: allow system messages (sender_id IS NULL) ─────────────────────

CREATE POLICY "Users can post system messages to their conversations"
  ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id IS NULL AND
    message_type = 'system' AND
    conversation_id IN (SELECT public.get_my_conversation_ids())
  );

-- ─── Auto-update updated_at ───────────────────────────────────────────────────

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
