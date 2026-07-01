-- Google Calendar is embed-only; remove sync column added in 058.
ALTER TABLE public.events
  DROP COLUMN IF EXISTS google_event_id;
