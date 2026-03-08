CREATE TYPE public.link_category AS ENUM (
  'organization',
  'learning',
  'tool',
  'article',
  'other'
);

CREATE TABLE public.community_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  category    public.link_category NOT NULL DEFAULT 'other',
  posted_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community links readable by authenticated users"
  ON public.community_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can post links"
  ON public.community_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Poster or admin can delete links"
  ON public.community_links FOR DELETE TO authenticated
  USING (
    auth.uid() = posted_by OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE INDEX idx_community_links_category ON public.community_links (category);
CREATE INDEX idx_community_links_created   ON public.community_links (created_at DESC);
