-- Track when a member agreed to the Community Guidelines.
--
-- Nullable with no default: existing members have NULL (they predate the
-- guidelines and have not yet agreed), and new members get the timestamp set
-- when they accept during onboarding (app/onboarding/actions.ts). Storing the
-- timestamp rather than a boolean lets us tell *when* someone agreed, which is
-- what we'll need if the guidelines are ever versioned and re-consent required.
--
-- Not a protected column: this is a self-attestation written on the member's
-- own session, so it is intentionally outside the guard added in
-- 20260721144537_harden_profiles_column_protection.sql (which covers only the
-- privilege-bearing columns role / approval_status).

ALTER TABLE public.profiles
  ADD COLUMN guidelines_accepted_at timestamptz;
