-- Polls: community-wide and group polls with options and votes

CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,  -- NULL = community-wide
  allow_multiple BOOLEAN DEFAULT false,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INT DEFAULT 0
);

CREATE TABLE public.poll_votes (
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (poll_id, option_id, user_id)
);

-- RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: community-wide polls visible to all authenticated, group polls visible to group members
CREATE POLICY "Anyone can view community polls" ON public.polls
  FOR SELECT TO authenticated USING (group_id IS NULL);

CREATE POLICY "Group members can view group polls" ON public.polls
  FOR SELECT TO authenticated USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create polls" ON public.polls
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Poll options: visible if the poll is visible
CREATE POLICY "Anyone can view poll options" ON public.poll_options
  FOR SELECT TO authenticated USING (
    poll_id IN (SELECT id FROM public.polls)
  );

CREATE POLICY "Poll creators can add options" ON public.poll_options
  FOR INSERT TO authenticated WITH CHECK (
    poll_id IN (SELECT id FROM public.polls WHERE created_by = auth.uid())
  );

-- Poll votes: users can vote and see votes
CREATE POLICY "Anyone can view votes" ON public.poll_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can cast their own votes" ON public.poll_votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own votes" ON public.poll_votes
  FOR DELETE TO authenticated USING (user_id = auth.uid());
