-- Community open source projects board
-- Members can share GitHub projects seeking contributors.

CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_url    TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  image_url     TEXT,
  language      TEXT,
  stars         INTEGER     NOT NULL DEFAULT 0,
  -- roles the project is seeking (engineer, designer, pm, data, devops, security, sme)
  roles_seeking TEXT[]      NOT NULL DEFAULT '{}',
  offers_mentorship BOOLEAN NOT NULL DEFAULT false,
  seeks_mentorship  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- All approved members can view projects
CREATE POLICY "projects_select_approved"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.approval_status = 'approved'
    )
  );

-- Members can insert their own projects
CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Members can update/delete their own projects; admins can update/delete any
CREATE POLICY "projects_update_own_or_admin"
  ON public.projects FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "projects_delete_own_or_admin"
  ON public.projects FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Index for listing by recency
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
