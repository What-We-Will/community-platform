-- Add a roles array to job_postings for tech specialization filtering
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_job_postings_roles
  ON public.job_postings USING GIN (roles);
