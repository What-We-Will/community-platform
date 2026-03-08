-- Weekly schedule table for the dashboard, editable by platform admins.

CREATE TABLE public.weekly_schedule (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  days        TEXT NOT NULL DEFAULT '',
  time        TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule is readable by authenticated users"
  ON public.weekly_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert schedule rows"
  ON public.weekly_schedule FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update schedule rows"
  ON public.weekly_schedule FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete schedule rows"
  ON public.weekly_schedule FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Seed with the current hardcoded schedule
INSERT INTO public.weekly_schedule (name, days, time, position) VALUES
  ('Daily Standup',                  'M–F',     '8am PT  |  11am ET', 0),
  ('Job App Group',                  'M, W',    '11am PT  |  2pm ET', 1),
  ('Building with AI — Study Group', 'T, R',    '11am PT  |  2pm ET', 2),
  ('Policy Discussion Group',        'F',       '11am PT  |  2pm ET', 3),
  ('Book Club',                      'Monthly', 'TBD',                4);
