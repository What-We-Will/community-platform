-- Allow admins to archive a group, rename it, and change private ↔ public.
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_groups_archived ON public.groups(archived) WHERE archived = false;
