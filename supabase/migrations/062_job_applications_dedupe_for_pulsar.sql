-- Prevent duplicate tracker rows when members add the same Pulsar match repeatedly.
-- Pulsar insert path normalizes missing/invalid URL to empty string so URL can
-- participate in a plain unique key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_user_company_position_url
  ON public.job_applications (
    user_id,
    company,
    position,
    url
  );
