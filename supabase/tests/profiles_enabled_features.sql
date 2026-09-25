-- Covers 20260905213503_add_profiles_enabled_features.sql.
--
-- Three claims, each provable only against a real database:
--   1. The vocabulary is enforced by the database, not TypeScript: an unsupported
--      key and a duplicated key are both rejected, and the empty array is accepted.
--   2. A member can write their own enabled_features through the existing
--      "Users can update own profile" policy with no change to the
--      column-protection guard, which inspects only role and approval_status.
--   3. A member cannot write another member's enabled_features. UPDATE denial
--      under RLS is silent (zero rows, no error), so it is asserted with
--      is_empty() on RETURNING and then a readback of the untouched row.
--
-- Ordering is load-bearing. Postgres checks table privileges before any policy,
-- and a missing grant fails with the same 42501 as an RLS denial, so the grant
-- is asserted first and the cross-member case is asserted as an empty result
-- rather than an error.

begin;

select plan(15);

-- Fixture as a privileged connection: inserting into auth.users fires
-- handle_new_user(), which creates each profiles row without naming
-- enabled_features, so both rows take the column default.
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
   '00000000-0000-0000-0000-000000000601',
   'authenticated',
   'authenticated',
   'enabled-features-owner@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now()),
  ('00000000-0000-0000-0000-000000000000',
   '00000000-0000-0000-0000-000000000602',
   'authenticated',
   'authenticated',
   'enabled-features-other@example.com',
   'not-used-by-pgtap',
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{}'::jsonb,
   now(),
   now());

-- Schema shape.
select col_not_null('public', 'profiles', 'enabled_features',
  'enabled_features is NOT NULL');

select col_default_is('public', 'profiles', 'enabled_features',
  '{events,discussions,job_referrals,resource_hub}',
  'enabled_features defaults to every feature');

select is(
  (select enabled_features from public.profiles
   where id = '00000000-0000-0000-0000-000000000601'),
  array['events','discussions','job_referrals','resource_hub']::text[],
  'a row created without naming the column receives the all-features default'
);

-- Built from migrations alone this database grants `authenticated` only SELECT
-- on public.profiles; the hosted project carries a wider out-of-band grant. The
-- subject here is the policy and the constraints, not the grant, so model the
-- hosted state. Dies with the rollback.
grant update on public.profiles to authenticated;

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated holds UPDATE, so any denial below is the policy and not the grant'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000601","role":"authenticated"}';

-- Negative control: the guard trigger is live for this session, so the
-- successful writes below are not explained by a privileged bypass.
select throws_ok(
  $$ update public.profiles
     set role = 'admin'
     where id = '00000000-0000-0000-0000-000000000601' $$,
  'P0001',
  'permission denied: role is a protected column',
  'guard is active: this session is a plain member'
);

-- Self-write through the existing row-scoped UPDATE policy.
select lives_ok(
  $$ update public.profiles
     set enabled_features = array['events','resource_hub']
     where id = '00000000-0000-0000-0000-000000000601' $$,
  'a member can update their own enabled_features'
);

select is(
  (select enabled_features from public.profiles
   where id = '00000000-0000-0000-0000-000000000601'),
  array['events','resource_hub']::text[],
  'the self-write landed rather than being silently filtered'
);

select lives_ok(
  $$ update public.profiles
     set enabled_features = '{}'
     where id = '00000000-0000-0000-0000-000000000601' $$,
  'the empty array is accepted: all-deselected is a valid state'
);

select is(
  (select cardinality(enabled_features) from public.profiles
   where id = '00000000-0000-0000-0000-000000000601'),
  0,
  'the empty array persisted as empty, not as the default'
);

-- Vocabulary enforced by CHECK constraints, reached as the member (not as a
-- privileged connection) so the rejection is what a real client would see.
--
-- An unknown key always violates both constraints: it fails containment, and
-- it raises cardinality above the count of known keys. Postgres reports the
-- first failing constraint in name order, which is _distinct, so only the
-- SQLSTATE is asserted here; the constraint name is pinned in the duplicate
-- case below, where containment holds and _distinct is the sole violation.
select throws_ok(
  $$ update public.profiles
     set enabled_features = array['events','newsletter']
     where id = '00000000-0000-0000-0000-000000000601' $$,
  '23514',
  null,
  'an unsupported key is rejected by the database'
);

select throws_ok(
  $$ update public.profiles
     set enabled_features = array['events','events']
     where id = '00000000-0000-0000-0000-000000000601' $$,
  '23514',
  'new row for relation "profiles" violates check constraint "profiles_enabled_features_distinct"',
  'a duplicated key is rejected by the database rather than de-duplicated'
);

-- Cross-member write. RLS filters the target row out of the UPDATE, so the
-- statement succeeds with zero rows: assert emptiness, then prove the row is
-- untouched (the SELECT policy is USING (true), so the readback is visible).
select is_empty(
  $$ update public.profiles
     set enabled_features = '{}'
     where id = '00000000-0000-0000-0000-000000000602'
     returning id $$,
  'a member cannot update another member''s enabled_features'
);

select is(
  (select enabled_features from public.profiles
   where id = '00000000-0000-0000-0000-000000000602'),
  array['events','discussions','job_referrals','resource_hub']::text[],
  'the other member''s preferences are unchanged after the denied write'
);

-- The other member, acting for themselves, can still write. Distinguishes
-- "row-scoped to the caller" from "column is read-only for everyone".
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000602","role":"authenticated"}';

select lives_ok(
  $$ update public.profiles
     set enabled_features = array['discussions']
     where id = '00000000-0000-0000-0000-000000000602' $$,
  'the other member can update their own enabled_features'
);

-- anon never reaches the table: no grant exists for it, and none should.
reset role;
set local role anon;

select throws_ok(
  $$ update public.profiles
     set enabled_features = '{}'
     where id = '00000000-0000-0000-0000-000000000602'
     returning id $$,
  '42501',
  'permission denied for table profiles',
  'anon cannot write enabled_features'
);

reset role;

select * from finish();

rollback;
