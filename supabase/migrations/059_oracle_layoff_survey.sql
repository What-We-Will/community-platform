-- Anonymous Oracle layoff survey (public landing). Inserts use service role only.

CREATE TABLE public.oracle_layoff_survey_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  survey_data  JSONB NOT NULL
);

CREATE INDEX idx_oracle_layoff_survey_created_at
  ON public.oracle_layoff_survey_responses (created_at DESC);

ALTER TABLE public.oracle_layoff_survey_responses ENABLE ROW LEVEL SECURITY;

-- No policies: anon/authenticated cannot read or write; service role bypasses RLS.
