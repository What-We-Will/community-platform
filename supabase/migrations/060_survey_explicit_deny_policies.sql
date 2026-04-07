-- Explicit deny-all RLS policies for survey tables.
-- RLS enabled with no policies already defaults to deny, but explicit
-- USING (false) makes the intent unambiguous and prevents accidental grants.

CREATE POLICY "deny_all" ON public.survey_responses
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "deny_all" ON public.survey_sensitive
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "deny_all" ON public.survey_meta
  FOR ALL
  USING (false)
  WITH CHECK (false);
