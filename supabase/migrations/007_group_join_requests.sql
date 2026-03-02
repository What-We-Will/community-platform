CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can see their own requests
CREATE POLICY "Users can view their own join requests" ON public.group_join_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Group admins can see all requests for their groups
CREATE POLICY "Admins can view join requests for their groups" ON public.group_join_requests
  FOR SELECT TO authenticated USING (
    group_id IN (SELECT public.get_my_admin_group_ids())
  );

-- Any authenticated user can submit a request (only to private groups they aren't already in)
CREATE POLICY "Users can request to join private groups" ON public.group_join_requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (SELECT id FROM public.groups WHERE is_private = true)
  );

-- Admins can approve or reject (update status)
CREATE POLICY "Admins can update join requests" ON public.group_join_requests
  FOR UPDATE TO authenticated
  USING (group_id IN (SELECT public.get_my_admin_group_ids()))
  WITH CHECK (group_id IN (SELECT public.get_my_admin_group_ids()));

-- Requesters can withdraw their own pending request
CREATE POLICY "Users can withdraw their pending requests" ON public.group_join_requests
  FOR DELETE TO authenticated USING (user_id = auth.uid() AND status = 'pending');
