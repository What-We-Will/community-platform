-- Category tabs for weekly schedule: General, Job Seekers, Organizers & Volunteers

ALTER TABLE public.weekly_schedule
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
  CHECK (category IN ('general', 'job_seekers', 'organizers_volunteers'));

CREATE INDEX IF NOT EXISTS idx_weekly_schedule_category
  ON public.weekly_schedule (category, position);

-- Best-effort backfill for existing rows
UPDATE public.weekly_schedule
SET category = 'job_seekers'
WHERE category = 'general'
  AND (
    name ILIKE '%job%app%'
    OR name ILIKE '%job search%'
    OR name ILIKE '%study group%'
    OR name ILIKE '%mock interview%'
  );

UPDATE public.weekly_schedule
SET category = 'organizers_volunteers'
WHERE category = 'general'
  AND (
    name ILIKE '%working group%'
    OR name ILIKE '%team meeting%'
    OR name ILIKE '%internal meeting%'
    OR name ILIKE '%policy%'
    OR name ILIKE '%platform engineering%'
    OR name ILIKE '%participatory%'
    OR name ILIKE '%workforce development%'
    OR name ILIKE '%media team%'
  );
