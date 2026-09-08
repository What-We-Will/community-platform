-- Covers 20260908014641_feature_adoption_counts.sql.
--
-- Three caller classes are asserted, because the function's authorization is
-- its own and not the /admin route's: anon is stopped by the EXECUTE grant, an
-- authenticated non-admin is stopped by the in-function role check, and only an
-- admin gets rows. Both denials surface as 42501, so the non-admin case pins
-- the message to prove it failed on the role check rather than on the grant.
--
-- The counts are asserted exactly. To make that possible, every profile that
-- already exists in this database is moved out of the counted cohort first;
-- the transaction rolls back, so the demotion is confined to this test.

begin;

select plan(7);

-- Privileged connection: clear the cohort so the fixtures below are the whole
-- counted population and expected values can be literal.
update public.profiles set approval_status = 'pending';

-- Inserting into auth.users fires handle_new_user(), which creates each
-- profiles row with the all-features default and approval_status 'pending';
-- the cohort members are approved explicitly below.
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
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000701',
   'authenticated',
   'authenticated',
   'adoption-admin@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000702',
   'authenticated',
   'authenticated',
   'adoption-member@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000703',
   'authenticated',
   'authenticated',
   'adoption-optout@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000704',
   'authenticated',
   'authenticated',
   'adoption-pending@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now());

update public.profiles
set approval_status = 'approved',
    role = 'admin',
    enabled_features = array['events', 'discussions']
where id = '00000000-0000-0000-0000-000000000701';

update public.profiles
set approval_status = 'approved',
    enabled_features = array['events']
where id = '00000000-0000-0000-0000-000000000702';

-- All-deselected member: counts toward the cohort total, toward no feature.
update public.profiles
set approval_status = 'approved',
    enabled_features = '{}'
where id = '00000000-0000-0000-0000-000000000703';

-- Row 704 keeps the pending default with every feature selected, so it must not
-- reach any count.

select is(
  (select role from public.profiles
   where id = '00000000-0000-0000-0000-000000000701'),
  'admin',
  'admin fixture is promoted before any authorization check runs'
);

-- Privileges, asserted separately from behavior: Postgres checks the EXECUTE
-- grant before the function body ever runs, and both denials are 42501.
select ok(
  has_function_privilege('authenticated', 'public.get_feature_adoption_counts()', 'EXECUTE'),
  'authenticated holds EXECUTE, so the non-admin denial below is the role check'
);

select ok(
  not has_function_privilege('anon', 'public.get_feature_adoption_counts()', 'EXECUTE'),
  'anon holds no EXECUTE on the adoption counts function'
);

set local role anon;

select throws_ok(
  $$ select * from public.get_feature_adoption_counts() $$,
  '42501',
  null,
  'anon cannot call the adoption counts function'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000702","role":"authenticated"}';

select throws_ok(
  $$ select * from public.get_feature_adoption_counts() $$,
  '42501',
  'permission denied: admin role required',
  'an authenticated non-admin is refused by the function''s own role check'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000701","role":"authenticated"}';

select is(
  current_user,
  'authenticated',
  'the admin case runs as a real request role, not a privileged connection'
);

-- Every supported feature appears, including the two nobody selected, and
-- member_total is 3: the three approved fixtures, excluding the pending one.
select results_eq(
  $$ select feature, enabled_count, member_total
     from public.get_feature_adoption_counts() $$,
  $$ values ('discussions'::text,   1::bigint, 3::bigint),
            ('events'::text,        2::bigint, 3::bigint),
            ('job_referrals'::text, 0::bigint, 3::bigint),
            ('resource_hub'::text,  0::bigint, 3::bigint) $$,
  'an admin gets one row per supported feature over approved members only'
);

reset role;

select * from finish();

rollback;
