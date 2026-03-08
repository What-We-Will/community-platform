ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS offers_referral      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_community_network BOOLEAN NOT NULL DEFAULT false;
