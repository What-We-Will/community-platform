-- Anonymous survey tables: survey_responses, survey_sensitive, survey_meta
-- RLS enabled on all three, no policies (service role only)

CREATE TABLE public.survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id TEXT NOT NULL,
  respondent_type TEXT NOT NULL
    CHECK (respondent_type IN ('laid_off_fte', 'laid_off_contractor', 'current_fte', 'current_contractor')),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT date_trunc('hour', now()) -- truncated to hour for k-anonymity
);

CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses (survey_id);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.survey_sensitive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id TEXT NOT NULL,
  encrypted_contact TEXT,
  contact_iv TEXT,
  contact_type TEXT
    CHECK (contact_type IS NULL OR contact_type IN ('email', 'phone', 'signal', 'other')),
  domain_hash TEXT,
  employment_status TEXT NOT NULL
    CHECK (employment_status IN ('laid_off_fte', 'laid_off_contractor', 'current_fte', 'current_contractor')),
  willingness TEXT NOT NULL
    CHECK (willingness IN ('very_interested', 'somewhat_interested', 'not_sure', 'not_interested')),
  key_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_survey_sensitive_survey_id ON public.survey_sensitive (survey_id);
ALTER TABLE public.survey_sensitive ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.survey_meta (
  survey_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.survey_meta ENABLE ROW LEVEL SECURITY;

INSERT INTO public.survey_meta (survey_id, status) VALUES ('layoff-survey-2026', 'active');
