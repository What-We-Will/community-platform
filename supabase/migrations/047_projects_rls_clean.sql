-- Clean-slate RLS for projects table.
-- Drops every policy (including the broken approval_status one from 043)
-- and recreates them with correct definitions.

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
  END LOOP;
END;
$$;

-- All authenticated users may read all projects
CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- Members may insert their own projects
CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Owners and admins may update
CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Owners and admins may delete
CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
