-- Atomic insert for survey submission: both rows succeed or neither does.
-- Called from the server action via supabase.rpc('submit_survey', ...).

CREATE OR REPLACE FUNCTION public.submit_survey(
  p_survey_id TEXT,
  p_respondent_type TEXT,
  p_answers JSONB,
  p_employment_status TEXT,
  p_willingness TEXT,
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
END;
$$;

-- Only callable via service role (no anon/authenticated access)
REVOKE ALL ON FUNCTION public.submit_survey FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_survey FROM anon;
REVOKE ALL ON FUNCTION public.submit_survey FROM authenticated;
