-- Landing page / Join CTA mailing list (anonymous signups).
-- Inserts are done server-side via service role; no anon insert policy.

CREATE TABLE public.mailing_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing_join',
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email)
);

CREATE INDEX idx_mailing_list_email ON public.mailing_list(email);
CREATE INDEX idx_mailing_list_subscribed_at ON public.mailing_list(subscribed_at);

ALTER TABLE public.mailing_list ENABLE ROW LEVEL SECURITY;

-- Only service role (server-side) can insert/select; no anon/public policies.
-- Application uses SUPABASE_SERVICE_ROLE_KEY in API route to insert.
