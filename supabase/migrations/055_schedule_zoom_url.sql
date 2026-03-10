ALTER TABLE public.weekly_schedule
  ADD COLUMN IF NOT EXISTS zoom_url TEXT;
