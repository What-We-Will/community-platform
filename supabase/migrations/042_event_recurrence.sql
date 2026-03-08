-- Add recurrence support to events.
-- recurrence_rule  : 'daily' or 'weekly' on the parent (first) event.
-- recurrence_end_date : the last date instances should be generated up to.
-- parent_event_id  : set on every child instance; null on the parent itself.
--   Deleting the parent cascades to all its instances.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence_rule      TEXT
    CHECK (recurrence_rule IN ('daily', 'weekly')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date  DATE,
  ADD COLUMN IF NOT EXISTS parent_event_id      UUID
    REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_parent_id
  ON public.events (parent_event_id)
  WHERE parent_event_id IS NOT NULL;
