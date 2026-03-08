-- Seed ActBlue open positions as community-network jobs (imported from Greenhouse API).
-- posted_by is NULL because these are system-imported, not posted by a specific member.

INSERT INTO public.job_postings
  (title, company, location, job_type, roles, url, is_community_network, offers_referral, posted_by)
VALUES
  (
    'Associate Director of Compliance',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['other'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8402263002',
    true, false, NULL
  ),
  (
    'Director of Data Science & Engineering',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['data_science', 'data_engineering'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8241935002',
    true, false, NULL
  ),
  (
    'Engineering Manager',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['backend', 'full_stack'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8189611002',
    true, false, NULL
  ),
  (
    'Full-time Summer Intern 2026',
    'ActBlue', 'Remote', 'internship',
    ARRAY['entry_level'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8430069002',
    true, false, NULL
  ),
  (
    'Principal, Program and Operations Management',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['project_management'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8418837002',
    true, false, NULL
  ),
  (
    'Program Manager, People & Culture',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['project_management'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8427375002',
    true, false, NULL
  ),
  (
    'Security Engineer II',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['backend'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8072487002',
    true, false, NULL
  ),
  (
    'Senior Payments Engineer',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['backend'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8384128002',
    true, false, NULL
  ),
  (
    'Senior Software Engineer I, Community Building',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['full_stack'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8372023002',
    true, false, NULL
  ),
  (
    'Software Engineer II',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['backend', 'full_stack'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8234061002',
    true, false, NULL
  ),
  (
    'Software Engineer II - Payments',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['backend'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8404039002',
    true, false, NULL
  ),
  (
    'Staff Engineer',
    'ActBlue', 'Remote', 'full_time',
    ARRAY['backend', 'full_stack'],
    'https://www.actblue.com/careers/available-positions/?gh_jid=8234055002',
    true, false, NULL
  )
ON CONFLICT DO NOTHING;
