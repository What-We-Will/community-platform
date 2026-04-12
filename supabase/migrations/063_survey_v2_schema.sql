-- Migration 063: Survey v2 schema — multi-survey support
--
-- DEPLOYMENT ORDERING: This migration must be applied BEFORE the code deploy.
-- The form renders without the survey_meta row, but submission will fail with
-- "survey not accepting responses" until this migration runs.
--
-- ROLLBACK (manual, if needed):
--   1. DELETE FROM public.survey_meta WHERE survey_id = 'severance-negotiation-2026';
--   2. Re-run migration 059 to restore original RPC (same arg types, no defaults, no conditional)
--   3. Re-add CHECK constraints from migration 058 definitions

-- 1. New survey_meta row (both surveys active simultaneously)
INSERT INTO public.survey_meta (survey_id, status)
VALUES ('severance-negotiation-2026', 'active');

-- 2. Drop CHECK constraints that restrict to old survey values
-- Columns stay NOT NULL — single-page surveys pass "anonymous"
ALTER TABLE public.survey_responses DROP CONSTRAINT IF EXISTS survey_responses_respondent_type_check;
ALTER TABLE public.survey_sensitive DROP CONSTRAINT IF EXISTS survey_sensitive_employment_status_check;
ALTER TABLE public.survey_sensitive DROP CONSTRAINT IF EXISTS survey_sensitive_willingness_check;

-- 3. Update RPC to handle optional sensitive data
-- p_respondent_type and p_employment_status default to "anonymous" for single-page surveys
-- p_willingness defaults to NULL; survey_sensitive insert is skipped when NULL
CREATE OR REPLACE FUNCTION public.submit_survey(
  p_survey_id TEXT,
  p_respondent_type TEXT DEFAULT 'anonymous',
  p_answers JSONB DEFAULT '{}'::JSONB,
  p_employment_status TEXT DEFAULT 'anonymous',
  p_willingness TEXT DEFAULT NULL,
  p_encrypted_contact TEXT DEFAULT NULL,
  p_contact_iv TEXT DEFAULT NULL,
  p_contact_type TEXT DEFAULT NULL,
  p_domain_hash TEXT DEFAULT NULL,
  p_key_version INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO survey_responses (survey_id, respondent_type, answers)
  VALUES (p_survey_id, p_respondent_type, p_answers);

  -- Only insert sensitive row if willingness is provided
  IF p_willingness IS NOT NULL THEN
    INSERT INTO survey_sensitive (
      survey_id, employment_status, willingness,
      encrypted_contact, contact_iv, contact_type,
      domain_hash, key_version
    )
    VALUES (
      p_survey_id, p_employment_status, p_willingness,
      p_encrypted_contact, p_contact_iv, p_contact_type,
      p_domain_hash, p_key_version
    );
  END IF;
END;
$$;

-- Permissions unchanged — service role only
REVOKE ALL ON FUNCTION public.submit_survey FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_survey FROM anon;
REVOKE ALL ON FUNCTION public.submit_survey FROM authenticated;
