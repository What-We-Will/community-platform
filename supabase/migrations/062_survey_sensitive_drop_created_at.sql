-- Drop created_at from survey_sensitive — no reporting use case justifies it,
-- and a timestamp (even hour-truncated) creates a correlation vector between
-- survey_sensitive and survey_responses in low-volume submission windows.
ALTER TABLE public.survey_sensitive DROP COLUMN created_at;
