-- Scheduled interviews for job applications

CREATE TABLE IF NOT EXISTS job_application_interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  interview_date  DATE NOT NULL,
  interview_time  TIME,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE job_application_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jai_select" ON job_application_interviews FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "jai_insert" ON job_application_interviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "jai_delete" ON job_application_interviews FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "jai_update" ON job_application_interviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
