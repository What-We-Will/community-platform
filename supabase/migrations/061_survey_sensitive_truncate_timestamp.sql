-- Align survey_sensitive.created_at with survey_responses: truncate to hour
-- to prevent timestamp correlation between the two tables.

ALTER TABLE public.survey_sensitive
  ALTER COLUMN created_at SET DEFAULT date_trunc('hour', now());
