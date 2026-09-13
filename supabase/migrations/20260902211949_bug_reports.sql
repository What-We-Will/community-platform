-- Bug-report intake queue: durable record of submitted bug reports + staff visibility.
-- This is an intake/triage signal (a leading indicator for planning), NOT the system of
-- record for bugs — GitHub Issues remains authoritative. A future task may promote confirmed
-- reports into GitHub Issues. Immutable log: no status, no updates.

CREATE TABLE public.bug_reports (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_email TEXT,
  description    TEXT        NOT NULL CHECK (char_length(description) <= 5000),
  steps          TEXT        CHECK (steps IS NULL OR char_length(steps) <= 5000),
  page_url       TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  seed_id        TEXT
);

CREATE INDEX idx_bug_reports_created_at ON public.bug_reports(created_at DESC);
CREATE INDEX idx_bug_reports_page_url ON public.bug_reports(page_url);
CREATE UNIQUE INDEX bug_reports_seed_id_key ON public.bug_reports(seed_id) WHERE seed_id IS NOT NULL;

-- RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Staff-only read. No insert/update/delete policy => denied for every client key;
-- the app route's service-role client bypasses RLS to insert. No update path (immutable).
CREATE POLICY "bug_reports_select_staff" ON public.bug_reports
  FOR SELECT TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
  );
