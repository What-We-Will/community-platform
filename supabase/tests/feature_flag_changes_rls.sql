begin;

select plan(32);

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
    '00000000-0000-0000-0000-000000000201',
    'authenticated',
    'authenticated',
    'feature-flag-changes-member@example.com',
    'not-used-by-pgtap',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000202',
    'authenticated',
    'authenticated',
    'feature-flag-changes-admin@example.com',
    'not-used-by-pgtap',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000203',
    'authenticated',
    'authenticated',
    'feature-flag-changes-moderator@example.com',
    'not-used-by-pgtap',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'admin'
where id = '00000000-0000-0000-0000-000000000202';

update public.profiles
set role = 'moderator'
where id = '00000000-0000-0000-0000-000000000203';

insert into public.feature_flags (
  key,
  type,
  owner,
  description,
  expires_at,
  seed_id
)
values (
  'pgtapAuditFlag',
  'release',
  'test-suite',
  'Temporary row for feature flag change audit tests.',
  '2030-01-01T00:00:00Z',
  'pgtap-audit-flag'
);

-- Fixture row for the access matrix; trigger-written rows have a null seed_id.
insert into public.feature_flag_changes (
  flag_key,
  old_enabled,
  new_enabled,
  changed_by,
  seed_id
)
values (
  'pgtapAuditFlag',
  false,
  true,
  '00000000-0000-0000-0000-000000000202',
  'pgtap-feature-flag-change'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.feature_flag_changes'::regclass),
  'feature_flag_changes has row level security enabled'
);

select ok(
  has_table_privilege('authenticated', 'public.feature_flag_changes', 'select')
  and not has_table_privilege('authenticated', 'public.feature_flag_changes', 'insert')
  and not has_table_privilege('authenticated', 'public.feature_flag_changes', 'update')
  and not has_table_privilege('authenticated', 'public.feature_flag_changes', 'delete'),
  'authenticated can only select feature flag changes'
);

select ok(
  not (
    has_table_privilege('authenticated', 'public.feature_flag_changes', 'truncate')
    or has_table_privilege('authenticated', 'public.feature_flag_changes', 'references')
    or has_table_privilege('authenticated', 'public.feature_flag_changes', 'trigger')
    or has_table_privilege('anon', 'public.feature_flag_changes', 'select')
    or has_table_privilege('anon', 'public.feature_flag_changes', 'truncate')
    or has_table_privilege('anon', 'public.feature_flag_changes', 'references')
    or has_table_privilege('anon', 'public.feature_flag_changes', 'trigger')
  ),
  'API roles have no truncate, references or trigger on feature flag changes'
);

select ok(
  not (
    has_function_privilege('authenticated', 'public.log_feature_flag_change()', 'execute')
    or has_function_privilege('anon', 'public.log_feature_flag_change()', 'execute')
    or has_function_privilege('public', 'public.log_feature_flag_change()', 'execute')
  ),
  'no API role can call the audit trigger function directly'
);

select has_trigger(
  'public',
  'feature_flags',
  'feature_flag_changes_log',
  'feature_flags has the change audit trigger'
);

select is_definer(
  'public',
  'log_feature_flag_change',
  array[]::name[],
  'the audit trigger function runs with its owner''s rights'
);

select is(
  (
    select proconfig
    from pg_proc
    where oid = 'public.log_feature_flag_change()'::regprocedure
  ),
  array['search_path=""']::text[],
  'the audit trigger function pins an empty search_path'
);

select results_eq(
  $$
    select enabled, (
      select count(*)::integer
      from public.feature_flag_changes
      where flag_key = 'pgtapAuditFlag' and seed_id is null
    )
    from public.feature_flags
    where key = 'pgtapAuditFlag'
  $$,
  $$ values (false, 0) $$,
  'audit fixture starts disabled with no recorded changes'
);

-- Flip sequence. Every state assertion runs as the privileged test role,
-- because RLS hides audit rows from members.

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', true);
set local role authenticated;

select results_eq(
  $$
    update public.feature_flags
    set enabled = true
    where key = 'pgtapAuditFlag'
    returning key
  $$,
  $$ values ('pgtapAuditFlag') $$,
  'admin can turn a flag on'
);

reset role;

select results_eq(
  $$
    select old_enabled, new_enabled, changed_by
    from public.feature_flag_changes
    where flag_key = 'pgtapAuditFlag' and seed_id is null
  $$,
  $$ values (false, true, '00000000-0000-0000-0000-000000000202'::uuid) $$,
  'turning a flag on records one change attributed to the admin'
);

set local role authenticated;

select results_eq(
  $$
    update public.feature_flags
    set enabled = enabled
    where key = 'pgtapAuditFlag'
    returning key
  $$,
  $$ values ('pgtapAuditFlag') $$,
  'admin same-value update matches the row'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.feature_flag_changes
    where flag_key = 'pgtapAuditFlag' and seed_id is null
  ),
  1,
  'a same-value update records no change'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);
set local role authenticated;

select is_empty(
  $$
    update public.feature_flags
    set enabled = false
    where key = 'pgtapAuditFlag'
    returning key
  $$,
  'member cannot turn a flag off'
);

reset role;

select results_eq(
  $$
    select enabled, (
      select count(*)::integer
      from public.feature_flag_changes
      where flag_key = 'pgtapAuditFlag' and seed_id is null
    )
    from public.feature_flags
    where key = 'pgtapAuditFlag'
  $$,
  $$ values (true, 1) $$,
  'a denied member flip leaves the flag and the audit trail unchanged'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', true);
set local role authenticated;

select results_eq(
  $$
    update public.feature_flags
    set enabled = false
    where key = 'pgtapAuditFlag'
    returning key
  $$,
  $$ values ('pgtapAuditFlag') $$,
  'admin can turn a flag off'
);

reset role;

select results_eq(
  $$
    select old_enabled, new_enabled, changed_by
    from public.feature_flag_changes
    where flag_key = 'pgtapAuditFlag' and seed_id is null
    order by id
  $$,
  $$
    values
      (false, true, '00000000-0000-0000-0000-000000000202'::uuid),
      (true, false, '00000000-0000-0000-0000-000000000202'::uuid)
  $$,
  'turning a flag off records the reverse transition'
);

-- A change made outside any API session: both claim settings cleared.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '', true);

update public.feature_flags
set enabled = true
where key = 'pgtapAuditFlag';

select results_eq(
  $$
    select old_enabled, new_enabled, changed_by
    from public.feature_flag_changes
    where flag_key = 'pgtapAuditFlag' and seed_id is null
    order by id desc
    limit 1
  $$,
  $$ values (false, true, null::uuid) $$,
  'a change made without an authenticated session records no actor'
);

-- Access matrix against the seeded fixture row.

set local role anon;

select throws_ok(
  $$ select id from public.feature_flag_changes $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'anonymous users cannot select feature flag changes'
);

select throws_ok(
  $$
    insert into public.feature_flag_changes (flag_key, old_enabled, new_enabled)
    values ('pgtapAuditFlag', true, false)
  $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'anonymous users cannot insert feature flag changes'
);

select throws_ok(
  $$ update public.feature_flag_changes set new_enabled = false $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'anonymous users cannot update feature flag changes'
);

select throws_ok(
  $$ delete from public.feature_flag_changes $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'anonymous users cannot delete feature flag changes'
);

reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);
set local role authenticated;

select is_empty(
  $$
    select id
    from public.feature_flag_changes
    where seed_id = 'pgtap-feature-flag-change'
  $$,
  'member cannot read feature flag changes'
);

select throws_ok(
  $$
    insert into public.feature_flag_changes (flag_key, old_enabled, new_enabled, changed_by)
    values ('pgtapAuditFlag', true, false, '00000000-0000-0000-0000-000000000202')
  $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'member cannot insert a change attributed to another user'
);

select throws_ok(
  $$ update public.feature_flag_changes set new_enabled = false $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'member cannot update feature flag changes'
);

select throws_ok(
  $$ delete from public.feature_flag_changes $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'member cannot delete feature flag changes'
);

reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000203', true);
set local role authenticated;

select is_empty(
  $$
    select id
    from public.feature_flag_changes
    where seed_id = 'pgtap-feature-flag-change'
  $$,
  'moderator cannot read feature flag changes'
);

reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', true);
set local role authenticated;

select results_eq(
  $$
    select seed_id
    from public.feature_flag_changes
    where seed_id = 'pgtap-feature-flag-change'
  $$,
  $$ values ('pgtap-feature-flag-change') $$,
  'admin can read feature flag changes'
);

select throws_ok(
  $$
    insert into public.feature_flag_changes (flag_key, old_enabled, new_enabled, changed_by)
    values ('pgtapAuditFlag', true, false, '00000000-0000-0000-0000-000000000201')
  $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'admin cannot insert a change attributed to another user'
);

select throws_ok(
  $$ update public.feature_flag_changes set new_enabled = false $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'admin cannot update feature flag changes'
);

select throws_ok(
  $$ delete from public.feature_flag_changes $$,
  '42501',
  'permission denied for table feature_flag_changes',
  'admin cannot delete feature flag changes'
);

reset role;

select policies_are(
  'public',
  'feature_flag_changes',
  array['Admins can read feature flag changes']::name[],
  'feature_flag_changes RLS policy names match the contract'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feature_flag_changes'
      and policyname = 'Admins can read feature flag changes'
      and roles = array['authenticated']::name[]
      and cmd = 'SELECT'
  ),
  'feature flag change reads are limited to an authenticated select policy'
);

select * from finish();
rollback;
