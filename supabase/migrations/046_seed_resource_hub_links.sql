-- Seed curated links for Resource Hub
-- (enum values added in 045 must be committed first)

-- ── Job Search Platforms — General ───────────────────────────────────────────
INSERT INTO public.community_links (title, url, description, category) VALUES
  ('LinkedIn Jobs',    'https://www.linkedin.com/jobs/',       'The largest professional network job board, with roles across every industry and seniority level.',  'job_board_general'),
  ('Indeed',           'https://www.indeed.com/',              'One of the world''s most-visited job sites, aggregating listings from thousands of sources.',          'job_board_general'),
  ('ZipRecruiter',     'https://www.ziprecruiter.com/',        'AI-powered matching that surfaces your profile to relevant employers.',                                 'job_board_general'),
  ('JobBright',        'https://jobbright.ai/',                'AI-driven job search platform focused on skills-based matching.',                                       'job_board_general'),
  ('iHireTechnology',  'https://www.ihiretechnology.com/',     'Niche tech job board covering software, IT, cybersecurity, and data roles.',                           'job_board_general');

-- ── Job Search Platforms — Remote-Focused ────────────────────────────────────
INSERT INTO public.community_links (title, url, description, category) VALUES
  ('We Work Remotely', 'https://weworkremotely.com/',          'One of the largest remote-work communities, with curated listings for engineers, designers, and more.', 'job_board_remote'),
  ('Remotive',         'https://remotive.com/',                'Hand-screened remote tech jobs updated daily.',                                                          'job_board_remote'),
  ('RemoteRocketship', 'https://remoterocketship.com/',        'Aggregator of fully-remote roles with salary transparency and company details.',                        'job_board_remote'),
  ('Arc.dev',          'https://arc.dev/remote-jobs',         'Vetted remote developer jobs from top startups and companies worldwide.',                               'job_board_remote'),
  ('RemoteOK',         'https://remoteok.com/',                'Real-time feed of remote jobs with salary data and tech stack filters.',                               'job_board_remote');

-- ── Communities & Networking ──────────────────────────────────────────────────
INSERT INTO public.community_links (title, url, description, category) VALUES
  ('Rands Leadership Slack', 'https://randsinrepose.com/welcome-to-rands-leadership-slack/', 'A 30,000+ member Slack community for longtime, new, and aspiring leaders to learn through conversation and sharing of ideas.', 'community');
