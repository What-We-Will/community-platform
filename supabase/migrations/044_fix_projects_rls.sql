-- Fix projects SELECT policy: profiles has no approval_status column.
-- Replace with a simple "authenticated users can read all projects" policy,
-- matching the pattern used by other tables in this schema.

DROP POLICY IF EXISTS "projects_select_approved" ON public.projects;

CREATE POLICY "projects_select_authenticated"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);
