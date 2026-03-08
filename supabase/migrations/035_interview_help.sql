-- Community interview help requests

CREATE TABLE IF NOT EXISTS interview_help_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  -- Denormalized display info so the dashboard card needs no extra joins
  title           TEXT NOT NULL,   -- e.g. "Second Interview · Acme Corp"
  company         TEXT NOT NULL,
  position        TEXT NOT NULL,
  interview_date  DATE NOT NULL,
  -- Link source: exactly one of these will be set
  stage_key       TEXT,            -- status_dates key (auto-detected stage)
  interview_id    UUID REFERENCES job_application_interviews(id) ON DELETE SET NULL,
  -- Optional note from the person asking for help
  message         TEXT,
  is_open         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE interview_help_requests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see open help requests (for the dashboard)
CREATE POLICY "ihr_select" ON interview_help_requests FOR SELECT TO authenticated USING (true);
-- Users manage their own requests
CREATE POLICY "ihr_insert" ON interview_help_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ihr_update" ON interview_help_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "ihr_delete" ON interview_help_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid());
