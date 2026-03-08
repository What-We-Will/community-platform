-- Star certain groups as official "What We Will Working Groups" (featured at top of groups page).

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS is_working_group boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_groups_is_working_group
  ON public.groups (is_working_group) WHERE is_working_group = true;

-- Allow platform admins (profiles.role = 'admin') to update any group (e.g. to set is_working_group).
CREATE POLICY "Platform admins can update any group"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
