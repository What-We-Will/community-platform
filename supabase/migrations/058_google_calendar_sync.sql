-- Google Calendar sync: link platform events to source calendar entries.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS google_event_id TEXT UNIQUE;

COMMENT ON COLUMN public.events.google_event_id IS
  'Google Calendar event ID used to upsert synced events. NULL for manually created events.';
