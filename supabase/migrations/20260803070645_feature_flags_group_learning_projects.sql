insert into public.feature_flags (
  key,
  enabled,
  type,
  fail_mode,
  owner,
  description,
  expires_at,
  seed_id
)
values
  (
    'groupLearning',
    false,
    'release',
    'closed',
    'platform',
    'Controls access to Group Learning.',
    '2027-07-29T00:00:00Z',
    'feature-flag-group-learning'
  ),
  (
    'projects',
    false,
    'release',
    'closed',
    'platform',
    'Controls access to Projects.',
    '2027-07-29T00:00:00Z',
    'feature-flag-projects'
  );
