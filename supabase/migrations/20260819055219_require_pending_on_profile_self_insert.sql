-- Completes the INSERT-time approval_status enforcement that
-- 20260721144537_harden_profiles_column_protection.sql:20-24 explicitly deferred
-- to "the separate approval_status default-flip work". That work is
-- 20260819031800, and flipping the default is what arms this check: while the
-- column defaulted to 'approved', an INSERT constraint was inert, because a
-- self-insert was approved whether or not it named the column. With the default
-- at 'pending', naming approval_status = 'approved' on a self-insert is the one
-- remaining self-approval path, and it is the path a user with no profiles row
-- can still take (an orphaned session, e.g. after a partially-failed rejectUser).
--
-- The check requires exactly 'pending' rather than merely not-'approved'. The
-- UPDATE guard in 20260721144537 is permissive about non-approved values because
-- it reasons about a transition away from a prior state, which grants nothing.
-- An INSERT has no prior state, and creation has exactly one valid starting
-- status, so the narrower rule excludes nothing legitimate.
--
-- No application change is required: both write paths upsert without naming
-- approval_status, so the row proposed for insertion takes the column default of
-- 'pending' and satisfies this check. On the ON CONFLICT branch the existing
-- status is left untouched, so an admin's early approval survives.
--
-- role = 'member' carries over from 20260721144537 unchanged.

DROP POLICY "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role = 'member'
    AND approval_status = 'pending'
  );
