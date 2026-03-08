-- Link tracker entries to job board postings, and add community notes.

-- Allow tracker entries to be linked to a specific job board posting
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_posting
  ON public.job_applications (job_posting_id) WHERE job_posting_id IS NOT NULL;

-- Community notes on job board postings
CREATE TABLE public.job_posting_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_posting_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments readable by authenticated users"
  ON public.job_posting_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can create comments"
  ON public.job_posting_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Author or admin can delete comments"
  ON public.job_posting_comments FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE INDEX idx_job_posting_comments_posting
  ON public.job_posting_comments (job_posting_id);
