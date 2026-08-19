-- Covers 20260818234828_bound_profiles_display_name_length.sql.
--
-- The 100-character bound is enforced in four places (both server actions, both
-- form inputs, and this constraint). Only the database can prove the last one,
-- and only the database can prove that char_length() agrees with the code-point
-- counting the TypeScript guard uses — that agreement is what stops a name from
-- passing the app layer and then being rejected on write.

begin;

select plan(9);

-- Fixture: inserting into auth.users fires handle_new_user(), which creates the
-- profile row. Short email so the generated display_name is well under the bound.
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
  '00000000-0000-0000-0000-000000000201',
  'authenticated',
  'authenticated',
  'display-name-bound@example.com',
  'not-used-by-pgtap',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

select isnt(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-000000000201'),
  null,
  'profile fixture is auto-created before constraint checks'
);

-- The constraint is deliberately NOT VALID: rows written before it existed are
-- left untouched, because shortening a member's chosen name is a product
-- decision. Pin that, so a later migration cannot quietly validate it without
-- the cleanup that decision requires.
select is(
  (select convalidated from pg_constraint
   where conname = 'profiles_display_name_length_check'
     and conrelid = 'public.profiles'::regclass),
  false,
  'constraint is NOT VALID so pre-existing oversized rows are not rewritten'
);

-- Boundary: exactly at the limit is accepted, one over is rejected.
select lives_ok(
  $$ update public.profiles
     set display_name = repeat('a', 100)
     where id = '00000000-0000-0000-0000-000000000201' $$,
  'a 100-character display name is accepted'
);

select is(
  (select char_length(display_name) from public.profiles
   where id = '00000000-0000-0000-0000-000000000201'),
  100,
  'the 100-character name is stored intact, not truncated'
);

select throws_ok(
  $$ update public.profiles
     set display_name = repeat('a', 101)
     where id = '00000000-0000-0000-0000-000000000201' $$,
  '23514',
  null,
  'a 101-character display name is rejected with a check violation'
);

-- Code-point counting: 100 emoji are 200 UTF-16 units in JavaScript but 100
-- characters to char_length(). The TypeScript guard counts with Array.from() for
-- exactly this reason; if these two assertions disagree with lib/utils/display-name.ts,
-- a name accepted by the app would be rejected on write.
select lives_ok(
  $$ update public.profiles
     set display_name = repeat('💩', 100)
     where id = '00000000-0000-0000-0000-000000000201' $$,
  '100 emoji are accepted — char_length counts code points, not UTF-16 units'
);

select throws_ok(
  $$ update public.profiles
     set display_name = repeat('💩', 101)
     where id = '00000000-0000-0000-0000-000000000201' $$,
  '23514',
  null,
  '101 emoji are rejected'
);

-- The constraint must bind on INSERT too, not only UPDATE.
delete from public.profiles where id = '00000000-0000-0000-0000-000000000201';

select throws_ok(
  $$ insert into public.profiles (id, display_name)
     values ('00000000-0000-0000-0000-000000000201', repeat('a', 101)) $$,
  '23514',
  null,
  'an oversized display name is rejected on insert, not only on update'
);

-- Regression: handle_new_user() derives display_name from the signup email when
-- no OAuth name is present. Emails can exceed 100 characters, so without the
-- left() bound added alongside this constraint, signup itself would fail.
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
  '00000000-0000-0000-0000-000000000202',
  'authenticated',
  'authenticated',
  repeat('a', 120) || '@example.com',
  'not-used-by-pgtap',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

select is(
  (select char_length(display_name) from public.profiles
   where id = '00000000-0000-0000-0000-000000000202'),
  100,
  'signup with an over-long email still creates a profile, bounded to the limit'
);

select * from finish();

rollback;
