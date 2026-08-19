-- Proves the two application write paths into public.profiles still satisfy the
-- column-protection guard from 20260721134035 / 20260721144537 (ADR-0006).
--
-- Those migrations landed after this feature's merge base, so neither
-- completeOnboarding() nor updateProfile() has ever run against the guard. The
-- column sets asserted below mirror the upsert payloads those actions issue; if
-- either action starts writing role or approval_status, this test fails.
--
-- The two negative controls run FIRST and are load-bearing: they prove the guard
-- is actually active for this session. Without them the lives_ok() assertions
-- would pass just as happily against a session that bypasses the trigger
-- (current_user in service_role/supabase_admin/postgres), proving nothing.

begin;

select plan(8);

-- Fixture as a privileged connection: inserting into auth.users fires
-- handle_new_user(), which creates the profiles row.
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
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000301',
  'authenticated',
  'authenticated',
  'write-paths-guard@example.com',
  'not-used-by-pgtap',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

-- Table privileges and RLS are separate, additive layers. Built from migrations
-- alone this database grants `authenticated` only SELECT on public.profiles
-- (20260802165253_feature_flags_least_privilege_grants.sql restates that as the
-- single grant on this table), so every write is refused with 42501 before RLS
-- or the guard trigger is ever consulted. The hosted project evidently carries
-- an out-of-band write grant — onboarding works there — and that migration's own
-- comment says as much: "not verified against any hosted project, which could
-- carry an out-of-band grant."
--
-- This test's subject is the guard, not the grants, so model the hosted
-- privilege state here. The grant is inside the transaction and dies with the
-- rollback. If the schema-vs-hosted privilege gap is ever closed in migrations,
-- this line becomes redundant rather than wrong.
grant insert, update on public.profiles to authenticated;

-- Become that user: current_user = 'authenticated' (so the guard's privileged
-- bypass does not apply) and auth.uid() resolves to their id (so the row-scoped
-- RLS policies match their own row).
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000301","role":"authenticated"}';

-- Negative control — the guard is live for this session. role is blocked
-- unconditionally, so this holds whatever the row's starting state is.
select throws_ok(
  $$ update public.profiles
     set role = 'admin'
     where id = '00000000-0000-0000-0000-000000000301' $$,
  'P0001',
  'permission denied: role is a protected column',
  'guard is active: self-promotion to admin is blocked for this session'
);

-- completeOnboarding(): upserts the onboarding column set, including
-- approval_status = 'pending'. That is a non-privilege-granting transition, so
-- the narrowed guard must permit it — this is the exact case 20260721144537
-- was written to unblock.
select lives_ok(
  $$ insert into public.profiles (
       id, display_name, avatar_url, headline, location, bio, skills,
       open_to_referrals, linkedin_url, github_url, portfolio_url, timezone,
       is_onboarded, approval_status
     )
     values (
       '00000000-0000-0000-0000-000000000301', 'Jane Doe', null, null, null,
       null, array['TypeScript'], true, 'https://linkedin.com/in/jane',
       'https://github.com/jane', 'https://jane.dev', 'America/Chicago',
       true, 'pending'
     )
     on conflict (id) do update set
       display_name = excluded.display_name,
       avatar_url = excluded.avatar_url,
       headline = excluded.headline,
       location = excluded.location,
       bio = excluded.bio,
       skills = excluded.skills,
       open_to_referrals = excluded.open_to_referrals,
       linkedin_url = excluded.linkedin_url,
       github_url = excluded.github_url,
       portfolio_url = excluded.portfolio_url,
       timezone = excluded.timezone,
       is_onboarded = excluded.is_onboarded,
       approval_status = excluded.approval_status $$,
  'completeOnboarding column set is accepted, including approval_status = pending'
);

select is(
  (select approval_status from public.profiles
   where id = '00000000-0000-0000-0000-000000000301'),
  'pending',
  'the onboarding write landed rather than being silently filtered'
);

-- Second negative control, placed here deliberately. Built from migrations the
-- approval_status column defaults to 'approved', so attempting to "self-approve"
-- before onboarding runs is not a transition at all and the guard correctly
-- ignores it. Only now, with the row at 'pending', is this the real
-- privilege-granting move the guard exists to stop.
select throws_ok(
  $$ update public.profiles
     set approval_status = 'approved'
     where id = '00000000-0000-0000-0000-000000000301' $$,
  'P0001',
  'permission denied: cannot self-approve (approval_status is a protected column)',
  'guard is active: pending -> approved self-approval is blocked'
);

-- updateProfile(): same table, no approval_status and no role in the payload.
-- Unlisted columns are untouched on the ON CONFLICT branch, so NEW matches OLD
-- for both protected columns and the guard has nothing to object to.
select lives_ok(
  $$ insert into public.profiles (
       id, display_name, headline, location, bio, skills, open_to_referrals,
       linkedin_url, github_url, portfolio_url, timezone, is_onboarded
     )
     values (
       '00000000-0000-0000-0000-000000000301', 'Jane Edited', 'Engineer',
       'Chicago', 'bio', array['TypeScript','Go'], false,
       'https://linkedin.com/in/jane-edited', 'https://github.com/jane-edited',
       'https://jane.dev/about', 'America/Chicago', true
     )
     on conflict (id) do update set
       display_name = excluded.display_name,
       headline = excluded.headline,
       location = excluded.location,
       bio = excluded.bio,
       skills = excluded.skills,
       open_to_referrals = excluded.open_to_referrals,
       linkedin_url = excluded.linkedin_url,
       github_url = excluded.github_url,
       portfolio_url = excluded.portfolio_url,
       timezone = excluded.timezone,
       is_onboarded = excluded.is_onboarded $$,
  'updateProfile column set is accepted — it touches neither protected column'
);

select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000301'),
  'Jane Edited',
  'the profile write landed rather than being silently filtered'
);

-- The profile edit must not have disturbed either protected column.
select is(
  (select approval_status from public.profiles
   where id = '00000000-0000-0000-0000-000000000301'),
  'pending',
  'updateProfile leaves approval_status as onboarding set it'
);

select is(
  (select role from public.profiles
   where id = '00000000-0000-0000-0000-000000000301'),
  'member',
  'updateProfile leaves role untouched'
);

reset role;

select * from finish();

rollback;
