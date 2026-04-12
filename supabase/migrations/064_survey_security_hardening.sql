-- Migration 064: Survey security hardening
--
-- Finding #3: Explicit per-role SELECT deny on survey_responses
-- Finding #5: UNIQUE constraint on (survey_id, session_token) for deduplication
--
-- NOTE: This migration is written to be idempotent. It partially ran on first
-- attempt (policies, column, constraint, and RPC created) but failed at REVOKE
-- because two submit_survey overloads existed (from migrations 059 and 063 —
-- 063's CREATE OR REPLACE created a new overload instead of replacing 059's
-- because the parameter defaults changed the resolved signature). Fixed below
-- by dropping the old overload explicitly before creating the new one, and by
-- using fully-qualified signatures in REVOKE.

-- ── Finding #3: Per-role SELECT deny policies ─────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "deny_select_anon" ON public.survey_responses
    FOR SELECT TO anon USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "deny_select_authenticated" ON public.survey_responses
    FOR SELECT TO authenticated USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Finding #5: session_token column + unique constraint ──────────────────────

ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS session_token TEXT;

DO $$ BEGIN
  ALTER TABLE public.survey_responses
    ADD CONSTRAINT survey_responses_survey_session_unique
    UNIQUE (survey_id, session_token);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── Drop all existing submit_survey overloads, then create the canonical one ──
-- Migration 059 created a 10-param version (no defaults on first 4 params).
-- Migration 063 created a second 10-param overload (with defaults added).
-- Both must be dropped before CREATE OR REPLACE can establish the 11-param version.

DROP FUNCTION IF EXISTS public.submit_survey(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);

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
  p_key_version INTEGER DEFAULT 1,
  p_session_token TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO survey_responses (survey_id, respondent_type, answers, session_token)
  VALUES (p_survey_id, p_respondent_type, p_answers, p_session_token);

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

-- Permissions — use fully-qualified signature to avoid ambiguity
REVOKE ALL ON FUNCTION public.submit_survey(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_survey(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.submit_survey(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM authenticated;
