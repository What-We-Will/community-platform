-- Individual job application tracker. Each user tracks their own applications.

CREATE TYPE public.application_status AS ENUM (
  'wishlist',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'withdrawn'
);

CREATE TABLE public.job_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company       TEXT NOT NULL,
  position      TEXT NOT NULL,
  applied_date  DATE,
  status        public.application_status NOT NULL DEFAULT 'applied',
  notes         TEXT,
  url           TEXT,
  is_shared     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Users can see their own applications, plus shared applications from others
CREATE POLICY "Users can read own and shared applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_shared = true);

-- Users can only insert their own applications
CREATE POLICY "Users can create own applications"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own applications
CREATE POLICY "Users can update own applications"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users or platform admins can delete
CREATE POLICY "Users or admins can delete applications"
  ON public.job_applications FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE INDEX idx_job_applications_user_id ON public.job_applications (user_id);
CREATE INDEX idx_job_applications_status  ON public.job_applications (status);
