-- Persisted outputs for Pulsar-powered My Tools features.

CREATE TABLE IF NOT EXISTS public.member_match_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id        TEXT NOT NULL,
  candidate_summary TEXT NOT NULL,
  matches           JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_match_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own match runs"
  ON public.member_match_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own match runs"
  ON public.member_match_runs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_member_match_runs_user_created
  ON public.member_match_runs (user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS public.member_career_briefs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id   TEXT NOT NULL,
  markdown     TEXT NOT NULL,
  model        TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_career_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own career briefs"
  ON public.member_career_briefs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own career briefs"
  ON public.member_career_briefs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_member_career_briefs_user_created
  ON public.member_career_briefs (user_id, created_at DESC);

