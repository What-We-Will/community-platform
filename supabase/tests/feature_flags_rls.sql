begin;

select plan(27);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'feature-flags-member@example.com',
    'not-used-by-pgtap',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000102',
    'authenticated',
    'authenticated',
    'feature-flags-admin@example.com',
    'not-used-by-pgtap',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'admin'
where id = '00000000-0000-0000-0000-000000000102';

select is(
  (
    select role
    from public.profiles
    where id = '00000000-0000-0000-0000-000000000102'
  ),
  'admin',
  'admin profile fixture is promoted before policy checks'
);

insert into public.feature_flags (
  key,
  type,
  owner,
  description,
  expires_at,
  updated_at,
  seed_id
)
values (
  'pgtapFeatureFlag',
  'release',
  'test-suite',
  'Temporary row for feature flag RLS tests.',
  '2030-01-01T00:00:00Z',
  '2000-01-01T00:00:00Z',
  'pgtap-feature-flag'
);

select ok(
  to_regclass('public.feature_flags') is not null
  and (select relrowsecurity from pg_class where oid = 'public.feature_flags'::regclass),
  'feature_flags has row level security enabled'
);

select ok(
  not has_table_privilege('authenticated', 'public.feature_flags', 'select'),
  'authenticated has no table-level select on feature flags'
);

select ok(
  has_any_column_privilege('authenticated', 'public.feature_flags', 'select'),
  'authenticated can select some feature_flags columns'
);

select ok(
  has_column_privilege('authenticated', 'public.feature_flags', 'key', 'select')
  and has_column_privilege('authenticated', 'public.feature_flags', 'enabled', 'select')
  and has_column_privilege('authenticated', 'public.feature_flags', 'fail_mode', 'select')
  and has_column_privilege('authenticated', 'public.feature_flags', 'updated_at', 'select'),
  'authenticated can select exactly the resolver columns'
);

select ok(
  not (
    has_column_privilege('authenticated', 'public.feature_flags', 'type', 'select')
    or has_column_privilege('authenticated', 'public.feature_flags', 'owner', 'select')
    or has_column_privilege('authenticated', 'public.feature_flags', 'description', 'select')
    or has_column_privilege('authenticated', 'public.feature_flags', 'expires_at', 'select')
    or has_column_privilege('authenticated', 'public.feature_flags', 'created_at', 'select')
    or has_column_privilege('authenticated', 'public.feature_flags', 'seed_id', 'select')
  ),
  'authenticated cannot select non-resolver feature_flags columns'
);

select ok(
  has_table_privilege('authenticated', 'public.feature_flags', 'insert'),
  'authenticated can attempt feature flag inserts for RLS evaluation'
);

select ok(
  has_table_privilege('authenticated', 'public.feature_flags', 'update'),
  'authenticated can attempt feature flag updates for RLS evaluation'
);

select ok(
  has_table_privilege('authenticated', 'public.feature_flags', 'delete'),
  'authenticated can attempt feature flag deletes for RLS evaluation'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated can evaluate the profile-based admin predicate'
);

set local role anon;

select is(
  current_user,
  'anon',
  'anonymous checks run as the anon database role'
);

select throws_ok(
  $$ select key from public.feature_flags where key = 'jobApplicationTracker' $$,
  '42501',
  'permission denied for table feature_flags',
  'anonymous users cannot select feature flags'
);

select throws_ok(
  $$
    insert into public.feature_flags (key, type)
    values ('pgtapAnonInsertFeatureFlag', 'ops')
  $$,
  '42501',
  'permission denied for table feature_flags',
  'anonymous users cannot insert feature flags'
);

select throws_ok(
  $$
    update public.feature_flags
    set enabled = true
    where key = 'pgtapFeatureFlag'
  $$,
  '42501',
  'permission denied for table feature_flags',
  'anonymous users cannot update feature flags'
);

select throws_ok(
  $$ delete from public.feature_flags where key = 'pgtapFeatureFlag' $$,
  '42501',
  'permission denied for table feature_flags',
  'anonymous users cannot delete feature flags'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000101',
  true
);
set local role authenticated;

select is(
  current_user,
  'authenticated',
  'member checks run as the authenticated database role'
);

select results_eq(
  $$ select key from public.feature_flags where key = 'jobApplicationTracker' $$,
  $$ values ('jobApplicationTracker') $$,
  'authenticated non-admin can select feature flags'
);

select is_empty(
  $$
    update public.feature_flags
    set enabled = true
    where key = 'pgtapFeatureFlag'
    returning key
  $$,
  'authenticated non-admin cannot update feature flags'
);

select throws_ok(
  $$
    insert into public.feature_flags (key, type)
    values ('pgtapMemberInsertFeatureFlag', 'ops')
  $$,
  '42501',
  'new row violates row-level security policy for table "feature_flags"',
  'authenticated non-admin cannot insert feature flags'
);

select is_empty(
  $$
    delete from public.feature_flags
    where key = 'pgtapFeatureFlag'
    returning key
  $$,
  'authenticated non-admin cannot delete feature flags'
);

reset role;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000102',
  true
);
set local role authenticated;

select results_eq(
  $$
    update public.feature_flags
    set enabled = true
    where key = 'pgtapFeatureFlag'
    returning enabled
  $$,
  $$ values (true) $$,
  'admin can update feature flags'
);

select results_eq(
  $$
    insert into public.feature_flags (key, type)
    values ('pgtapAdminInsertFeatureFlag', 'ops')
    returning key
  $$,
  $$ values ('pgtapAdminInsertFeatureFlag') $$,
  'admin can insert feature flags'
);

select results_eq(
  $$
    delete from public.feature_flags
    where key = 'pgtapAdminInsertFeatureFlag'
    returning key
  $$,
  $$ values ('pgtapAdminInsertFeatureFlag') $$,
  'admin can delete feature flags'
);

select ok(
  (
    select updated_at > '2000-01-01T00:00:00Z'::timestamptz
    from public.feature_flags
    where key = 'pgtapFeatureFlag'
  ),
  'raw SQL updates refresh updated_at through the shared trigger'
);

select throws_ok(
  $$
    insert into public.feature_flags (key, type)
    values ('pgtapMissingExpiry', 'release')
  $$,
  '23514',
  'new row for relation "feature_flags" violates check constraint "feature_flags_expires_at_check"',
  'release flags require an expiry'
);

select results_eq(
  $$
    select count(*)::integer
    from pg_policies
    where schemaname = 'public' and tablename = 'feature_flags'
  $$,
  $$ values (4) $$,
  'feature_flags has exactly four RLS policies'
);

select policies_are(
  'public',
  'feature_flags',
  array[
    'Admins can delete feature flags',
    'Admins can insert feature flags',
    'Admins can update feature flags',
    'Authenticated users can read feature flags'
  ]::name[],
  'feature_flags RLS policy names match the contract'
);

select * from finish();
rollback;
