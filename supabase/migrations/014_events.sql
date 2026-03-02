-- Community events and RSVPs

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('skillshare', 'workshop', 'ama', 'mock_interview', 'social', 'other')),
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  location TEXT DEFAULT 'Online',
  video_room_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_attendees INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_group ON public.events(group_id);
CREATE INDEX idx_events_host ON public.events(host_id);

CREATE TABLE public.event_rsvps (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Events: community events visible to all, group events visible to group members
CREATE POLICY "Anyone can view community events" ON public.events
  FOR SELECT TO authenticated USING (group_id IS NULL);

CREATE POLICY "Group members can view group events" ON public.events
  FOR SELECT TO authenticated USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their events" ON public.events
  FOR UPDATE TO authenticated USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete their events" ON public.events
  FOR DELETE TO authenticated USING (host_id = auth.uid());

-- RSVPs
CREATE POLICY "Anyone can view RSVPs for visible events" ON public.event_rsvps
  FOR SELECT TO authenticated USING (
    event_id IN (SELECT id FROM public.events)
  );

CREATE POLICY "Users can RSVP" ON public.event_rsvps
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their RSVP" ON public.event_rsvps
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can remove their RSVP" ON public.event_rsvps
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
