-- When a creator inserts the first group_members row (themselves as admin),
-- the "Creators can add themselves as admin" policy on group_members evaluates:
--
--   group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
--
-- That subquery runs with groups SELECT RLS applied.  For a PRIVATE group
-- the only SELECT policies are:
--   • is_private = false              → FALSE (it IS private)
--   • id IN (get_my_group_ids())      → FALSE (creator not in group_members yet)
--
-- So the subquery returns nothing and the INSERT is rejected, causing
-- createGroup() to fail for every private group.
--
-- Fix: add a policy that lets creators always see their own groups,
-- regardless of privacy or membership status.

CREATE POLICY "Creators can view their own groups" ON public.groups
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());
