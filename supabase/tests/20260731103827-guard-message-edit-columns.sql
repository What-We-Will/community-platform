-- pgTAP coverage for 20260731103827_guard_message_edit_columns.sql.
--
-- ⚠️  NOT YET RUNNABLE IN THIS REPO. This is the first pgTAP file here. Nothing
--     installs the pgtap extension or the `tests.*` helper schema
--     (create_supabase_user / authenticate_as / clear_authentication), there is
--     no `supabase test db` script in package.json, and CI does not invoke it.
--     Treat these assertions as a specification of intended behaviour that has
--     never executed — not as evidence the trigger works. Until the harness
--     exists, the trigger must be verified by hand against a personal Supabase
--     project, per ADR-0002 (local-first authoring).
--
-- Per TESTING_STANDARDS.security-rls.md: application-layer mocks verify that
-- the app sends the right arguments, not that the database enforces the rule.
--
-- Run with (once the harness exists): supabase test db

begin;
select plan(14);

-- ── Setup ────────────────────────────────────────────────────────────────────

select tests.create_supabase_user('author', 'author@test.com');
select tests.create_supabase_user('bystander', 'bystander@test.com');

-- Seeded on a privileged connection so the guard's service-role bypass applies
-- and setup is not itself under test.
insert into public.conversations (id, type)
values ('11111111-1111-1111-1111-111111111111', 'dm');

insert into public.conversation_participants (conversation_id, user_id)
values
  ('11111111-1111-1111-1111-111111111111', tests.get_supabase_uid('author')),
  ('11111111-1111-1111-1111-111111111111', tests.get_supabase_uid('bystander'));

insert into public.messages (id, conversation_id, sender_id, content, message_type, metadata)
values
  ('22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   tests.get_supabase_uid('author'),
   'original text', 'text', '{"a": 1}'),
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   null,
   'Video call ended', 'system', '{}');

-- ── The author may edit their own text message ───────────────────────────────

select tests.authenticate_as('author');

select lives_ok(
  $$ update public.messages set content = 'corrected text'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'Author can edit the content of their own text message'
);

select results_eq(
  $$ select content from public.messages
     where id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('corrected text') $$,
  'The edit is persisted'
);

select isnt(
  (select edited_at from public.messages
   where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'edited_at is stamped by the trigger, not left null'
);

-- ── edited_at is server-controlled, never client-supplied ────────────────────
-- The client sends an edited_at far in the past; the trigger must overwrite it.

update public.messages
set content = 'corrected twice', edited_at = '2000-01-01T00:00:00Z'
where id = '22222222-2222-2222-2222-222222222222';

select ok(
  (select edited_at from public.messages
   where id = '22222222-2222-2222-2222-222222222222') > '2020-01-01'::timestamptz,
  'A client-supplied edited_at is overwritten rather than honoured'
);

-- ── Identity and provenance columns are immutable ────────────────────────────

select throws_ok(
  $$ update public.messages set id = '44444444-4444-4444-4444-444444444444'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'permission denied: id is not editable',
  'Author cannot change the identity of their message'
);

select throws_ok(
  $$ update public.messages
     set conversation_id = '55555555-5555-5555-5555-555555555555'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'permission denied: conversation_id is not editable',
  'Author cannot move their message into another conversation'
);

select throws_ok(
  $$ update public.messages set sender_id = tests.get_supabase_uid('bystander')
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'permission denied: sender_id is not editable',
  'Author cannot reattribute their message to another member'
);

select throws_ok(
  $$ update public.messages set created_at = '2000-01-01T00:00:00Z'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'permission denied: created_at is not editable',
  'Author cannot backdate their message'
);

select throws_ok(
  $$ update public.messages set message_type = 'system'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'permission denied: message_type is not editable',
  'Author cannot convert their message into a system message'
);

select throws_ok(
  $$ update public.messages set metadata = '{"a": 2}'
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'permission denied: metadata is not editable',
  'Author cannot rewrite message metadata'
);

-- ── Content rules ────────────────────────────────────────────────────────────

select throws_ok(
  $$ update public.messages set content = '   '
     where id = '22222222-2222-2222-2222-222222222222' $$,
  'message content cannot be empty',
  'An edit cannot empty a message — that is deletion, a separate feature'
);

select throws_ok(
  $$ update public.messages set content = 'rewritten'
     where id = '33333333-3333-3333-3333-333333333333' $$,
  'permission denied: only text messages can be edited',
  'Non-text messages are not editable'
);

-- ── Cross-user isolation ─────────────────────────────────────────────────────

select tests.authenticate_as('bystander');

select is_empty(
  $$ update public.messages set content = 'hijacked'
     where id = '22222222-2222-2222-2222-222222222222'
     returning id $$,
  'A different participant cannot edit someone else''s message'
);

-- ── Anonymous access ─────────────────────────────────────────────────────────

select tests.clear_authentication();

select is_empty(
  $$ update public.messages set content = 'anonymous edit'
     where id = '22222222-2222-2222-2222-222222222222'
     returning id $$,
  'An unauthenticated caller cannot edit any message'
);

select * from finish();
rollback;
