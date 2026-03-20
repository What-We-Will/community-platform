-- Store the IANA timezone the event was created in.
-- Used for display context ("2 PM ET") and correct round-tripping in edit forms.
-- Defaults to America/Chicago to match the profile timezone default.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Chicago';

-- Backfill: set existing events to their host's profile timezone (best guess).
UPDATE public.events e
SET timezone = COALESCE(
  (SELECT p.timezone FROM public.profiles p WHERE p.id = e.host_id),
  'America/Chicago'
);
