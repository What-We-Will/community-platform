-- Community job board: members can post and browse job listings.

CREATE TYPE public.job_type AS ENUM (
  'full_time', 'part_time', 'contract', 'internship', 'volunteer'
);

CREATE TABLE public.job_postings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  company      TEXT NOT NULL,
  location     TEXT,
  job_type     public.job_type NOT NULL DEFAULT 'full_time',
  description  TEXT,
  url          TEXT,
  posted_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Job postings are readable by authenticated users"
  ON public.job_postings FOR SELECT TO authenticated USING (true);

-- Any authenticated member can post a job
CREATE POLICY "Members can create job postings"
  ON public.job_postings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = posted_by);

-- Poster or platform admin can update
CREATE POLICY "Poster or admin can update job postings"
  ON public.job_postings FOR UPDATE TO authenticated
  USING (
    auth.uid() = posted_by OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Poster or platform admin can delete
CREATE POLICY "Poster or admin can delete job postings"
  ON public.job_postings FOR DELETE TO authenticated
  USING (
    auth.uid() = posted_by OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
