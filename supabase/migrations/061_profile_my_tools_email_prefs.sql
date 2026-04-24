-- Opt-in weekly email nudges for My Tools (profile completeness / manual refresh reminder).
-- Does not trigger Pulsar calls; cron only sends email.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_my_tools_reminders BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_my_tools_reminder_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.email_my_tools_reminders IS
  'Member opt-in: periodic email with link to My Tools / profile (no automatic API refresh).';
COMMENT ON COLUMN public.profiles.last_my_tools_reminder_sent_at IS
  'Rate-limits reminder emails (e.g. weekly) from the cron job.';
