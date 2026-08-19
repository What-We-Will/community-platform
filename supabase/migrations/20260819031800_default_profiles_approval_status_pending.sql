-- public.profiles.approval_status has defaulted to 'approved' since
-- 001_profiles.sql, while the hosted project carries a 'pending' default applied
-- out of band. A database built from these migrations therefore auto-approved
-- every new signup, so the admin approval queue stayed empty and no local or CI
-- run could reproduce approval behavior at all.
--
-- Existing rows are deliberately not backfilled. Members approved under the old
-- default hold real access, and rewriting them to 'pending' would revoke it.
--
-- This also makes the default load-bearing for onboarding: completeOnboarding()
-- no longer names approval_status in its upsert, so a profile row created by
-- that path (rather than by the handle_new_user trigger) takes its starting
-- status from here.

ALTER TABLE public.profiles
  ALTER COLUMN approval_status SET DEFAULT 'pending';
