-- The original created_by FK pointed at auth.users, which PostgREST cannot
-- join across schemas. Re-point it at public.profiles (same pattern as every
-- other table in this schema) so the creator:created_by(id, display_name)
-- join works correctly.

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
