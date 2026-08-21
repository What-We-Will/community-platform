-- Covers 20260819055219_require_pending_on_profile_self_insert.sql.
--
-- The INSERT policy is the only thing standing between an orphaned session (a
-- user holding a token with no profiles row, e.g. after a partially-failed
-- rejectUser) and a self-approved profile. The guard trigger cannot help here:
-- it is BEFORE UPDATE, so it never runs on INSERT.
--
-- The check requires exactly 'pending'. The 'rejected' case below is what makes
-- that a tested decision rather than a stated one — under a merely
-- not-'approved' rule it would succeed.
--
-- Ordering is load-bearing. Table privileges are checked by Postgres before any
-- policy is evaluated, and a missing grant fails with the same 42501 as an RLS
-- denial. So the grant is asserted first, and every denial below is matched on
-- the row-level-security message rather than the SQLSTATE alone — otherwise a
-- test that "proves" the policy blocks self-approval would pass just as happily
-- against a session that never reached the policy at all.

begin;

select plan(6);

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
values
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000501',
   'authenticated',
   'authenticated',
   'self-insert-denied@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000502',
   'authenticated',
   'authenticated',
   'self-insert-allowed@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now());

-- Model the orphaned session: a valid token, no profiles row. The accepted case
-- gets its own identity so it cannot collide on the primary key with a rejected
-- insert that wrongly succeeded — otherwise a policy regression would surface as
-- a duplicate-key failure in the positive test rather than where it belongs.
delete from public.profiles
where id in ('00000000-0000-0000-0000-000000000501',
             '00000000-0000-0000-0000-000000000502');

-- Built from migrations alone this database grants `authenticated` only SELECT
-- on public.profiles, so an INSERT would be refused before RLS is consulted.
-- The hosted project carries a wider out-of-band grant, so model that here: the
-- subject of this test is the policy, not the grant. Dies with the rollback.
grant insert on public.profiles to authenticated;

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'INSERT'),
  'authenticated holds INSERT, so any denial below is the policy and not the grant'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000501","role":"authenticated"}';

-- Negative control: the session is policy-bound rather than privileged. role is
-- rejected independently of approval_status, so this holds regardless of the
-- rest of the file.
select throws_ok(
  $$ insert into public.profiles (id, display_name, role, approval_status)
     values ('00000000-0000-0000-0000-000000000501', 'Escalator', 'admin', 'pending') $$,
  '42501',
  'new row violates row-level security policy for table "profiles"',
  'policy is live for this session: self-insert as admin is blocked'
);

-- The self-approval path this migration closes.
select throws_ok(
  $$ insert into public.profiles (id, display_name, role, approval_status)
     values ('00000000-0000-0000-0000-000000000501', 'Self Approver', 'member', 'approved') $$,
  '42501',
  'new row violates row-level security policy for table "profiles"',
  'self-insert claiming approved is blocked'
);

-- Distinguishes "exactly pending" from "anything but approved". A permissive
-- rule modelled on the UPDATE guard would let this through.
select throws_ok(
  $$ insert into public.profiles (id, display_name, role, approval_status)
     values ('00000000-0000-0000-0000-000000000501', 'Off Status', 'member', 'rejected') $$,
  '42501',
  'new row violates row-level security policy for table "profiles"',
  'self-insert with any other status is blocked, not merely non-approved ones'
);

-- The legitimate shape: both application write paths omit approval_status, so
-- the proposed row takes the column default. Runs as the second identity, whose
-- row none of the denials above could have created.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000502","role":"authenticated"}';

select lives_ok(
  $$ insert into public.profiles (id, display_name, role)
     values ('00000000-0000-0000-0000-000000000502', 'Jane Doe', 'member') $$,
  'self-insert omitting approval_status is accepted'
);

select is(
  (select approval_status from public.profiles
   where id = '00000000-0000-0000-0000-000000000502'),
  'pending',
  'the accepted row starts pending, from the column default'
);

reset role;

select * from finish();

rollback;
