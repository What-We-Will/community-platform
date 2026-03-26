-- The events.timezone column stores the IANA timezone in which the event was created.
-- starts_at and ends_at are always stored as UTC (timestamptz).
-- This assumes the Postgres server timezone is UTC (Supabase default: SHOW timezone → 'UTC').
-- Used for display context ("2 PM ET") and correct round-tripping in edit forms.
-- Defaults to America/Chicago to match the profile timezone default.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Chicago';

-- Backfill: set existing events to their host's profile timezone (best guess).
-- NOTE: This query reads from public.profiles, which is safe here because
-- migrations run as the database superuser and bypass RLS. Do not copy this
-- cross-table SELECT pattern into application code — RLS will block it.
UPDATE public.events e
SET timezone = COALESCE(
  (SELECT p.timezone FROM public.profiles p WHERE p.id = e.host_id),
  'America/Chicago'
);
