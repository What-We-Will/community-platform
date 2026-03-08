-- Track dates for each status stage and separate personal/community notes
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS status_dates JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS community_notes TEXT;

-- Seed status_dates with applied_date for rows that have one
UPDATE job_applications
SET status_dates = jsonb_build_object('applied', applied_date::text)
WHERE applied_date IS NOT NULL
  AND status_dates = '{}';
