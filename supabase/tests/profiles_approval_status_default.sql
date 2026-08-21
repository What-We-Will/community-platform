-- Covers 20260819031800_default_profiles_approval_status_pending.sql.
--
-- The admin approval queue only works if a new signup starts unapproved. Until
-- this migration a database built from the repository defaulted the column to
-- 'approved', so the queue was permanently empty locally and in CI while the
-- hosted project — carrying an out-of-band 'pending' default — behaved the
-- opposite way. Only the database can prove which default is in effect.
--
-- The signup path is asserted through the handle_new_user trigger rather than a
-- direct insert, because that trigger names only (id, display_name): whatever
-- the column default is, is what a real new account gets.

begin;

select plan(5);

select col_default_is(
  'public',
  'profiles',
  'approval_status',
  'pending',
  'the column default is pending, matching the hosted project'
);

-- Fixture: inserting into auth.users fires handle_new_user(), which creates the
-- profiles row without naming approval_status.
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
  '00000000-0000-0000-0000-000000000401',
  'authenticated',
  'authenticated',
  'approval-default@example.com',
  'not-used-by-pgtap',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

select is(
  (select approval_status from public.profiles
   where id = '00000000-0000-0000-0000-000000000401'),
  'pending',
  'a newly signed-up account is not auto-approved'
);

select is(
  (select is_onboarded from public.profiles
   where id = '00000000-0000-0000-0000-000000000401'),
  false,
  'the signup row is not onboarded, so it is an abandoned signup until the form runs'
);

-- completeOnboarding() omits approval_status from its upsert so that an admin
-- who approved someone early is not overruled on submission. Prove the omission
-- preserves the stored value rather than resetting it — the mocked action test
-- can only prove the payload, not what Postgres does with it.
update public.profiles
set approval_status = 'approved'
where id = '00000000-0000-0000-0000-000000000401';

insert into public.profiles (
  id, display_name, avatar_url, headline, location, bio, skills,
  open_to_referrals, linkedin_url, github_url, portfolio_url, timezone,
  is_onboarded
)
values (
  '00000000-0000-0000-0000-000000000401', 'Jane Doe', null, null, null,
  null, array['TypeScript'], true, 'https://linkedin.com/in/jane',
  null, null, 'America/Chicago', true
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
  is_onboarded = excluded.is_onboarded;

select is(
  (select approval_status from public.profiles
   where id = '00000000-0000-0000-0000-000000000401'),
  'approved',
  'completing onboarding leaves an already-approved profile approved'
);

select is(
  (select is_onboarded from public.profiles
   where id = '00000000-0000-0000-0000-000000000401'),
  true,
  'the onboarding write still landed'
);

select * from finish();

rollback;
