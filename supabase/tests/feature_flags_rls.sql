begin;

select plan(15);

select tests.create_supabase_user('feature_flags_member', 'feature-flags-member@example.com');
select tests.create_supabase_user('feature_flags_admin', 'feature-flags-admin@example.com');

update public.profiles
set role = 'admin'
where id = tests.get_supabase_uid('feature_flags_admin');

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

set local role anon;

select is(
  current_user,
  'anon',
  'anonymous checks run as the anon database role'
);

select is_empty(
  $$ select key from public.feature_flags where key = 'jobApplicationTracker' $$,
  'anonymous users cannot select feature flags'
);

reset role;

select tests.authenticate_as('feature_flags_member');

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

select tests.authenticate_as('feature_flags_admin');

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

select results_eq(
  $$
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'feature_flags'
    order by policyname
  $$,
  $$
    values
      ('Admins can delete feature flags'),
      ('Admins can insert feature flags'),
      ('Admins can update feature flags'),
      ('Authenticated users can read feature flags')
  $$,
  'feature_flags RLS policy names match the contract'
);

select * from finish();
rollback;
