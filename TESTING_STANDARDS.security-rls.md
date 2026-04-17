# Testing Standards — Security and RLS

Load this file for RLS migrations, auth work, and security-sensitive features. Assumes preamble is loaded.

**Last updated:** 2026-03-29 · **Applies to:** Jest 29 + pgTAP · **Owner:** platform lead

---

## Security-specific test requirements

Auth and data access code is flagged for human review in this project. Tests in these areas carry three additional requirements beyond the preamble:

1. **Every server action must test the unauthenticated case.** Assert it returns an error or redirects — never data.
2. **Every data helper that filters by user must test cross-user isolation.** Assert that user A cannot access user B's data through the application layer.
3. **RLS policies must be tested at the database level via pgTAP.** Application-layer mocks are not sufficient for security claims — they verify application logic, not the policy itself.

---

## RLS policy testing with pgTAP

Mocking the Supabase client in Jest confirms that your application code passes the right arguments. It does **not** confirm that the database enforces the policy. These are different claims. Both must be tested.

### Requirements

- Every migration that adds or modifies an RLS policy must include a corresponding pgTAP test in `supabase/tests/`.
- File naming: `XX-description.sql` matching the migration number.
- Every pgTAP test must wrap in `begin` / `rollback` to leave the database unchanged.

### Test pattern

```sql
begin;
select plan(3);

-- Setup: create test users
select tests.create_supabase_user('owner', 'owner@test.com');
select tests.create_supabase_user('other', 'other@test.com');

-- Insert test data as owner
select tests.authenticate_as('owner');
insert into events (id, title, host_id)
values ('evt-1', 'Test', (select tests.get_supabase_uid('owner')));

-- Assert: owner can read their own event
select results_eq(
  $$ select title from events where id = 'evt-1' $$,
  $$ values ('Test') $$,
  'Owner can read own event'
);

-- Assert: other user can also read (public events)
select tests.authenticate_as('other');
select results_eq(
  $$ select title from events where id = 'evt-1' $$,
  $$ values ('Test') $$,
  'Other user can read public event'
);

-- Assert: other user cannot update
select tests.authenticate_as('other');
select is_empty(
  $$ update events set title = 'Hacked' where id = 'evt-1' returning id $$,
  'Other user cannot update event'
);

select * from finish();
rollback;
```

### What to test in every pgTAP file

- Authenticated vs. anonymous access
- Owner vs. non-owner for read / write / delete
- Edge cases: soft deletes, group membership checks, admin privileges

### Run

```bash
supabase test db
```

---

## E2E testing

Jest and React Testing Library cannot test async Server Components — this is a [known Next.js limitation](https://nextjs.org/docs/app/guides/testing/vitest). Critical user flows that span server components, server actions, and navigation require E2E tests.

### Setup

- **Tool:** Playwright (chromium only)
- **Test directory:** `e2e/`
- **Config:** `playwright.config.ts` (project root)
- **Auth helper:** `e2e/fixtures/auth.ts` — `loginWithPassword()` with `Promise.race` error detection
- **Env vars:** Copy `.env.e2e.example` to `.env.e2e` and fill in test credentials (gitignored, separate from app env)

### Scripts

| Command | Use case |
|---|---|
| `npm run test:e2e` | Headless, CI-friendly |
| `npm run test:e2e:headed` | Visible browser with video recording |
| `npm run test:e2e:ui` | Interactive time-travel debugger |
| `npm run test:e2e:debug` | Step-through debugger |

### Flows requiring E2E coverage

- Auth flow: login → onboarding / pending-approval / dashboard (covered)
- Invalid credentials: stays on login, error visible (covered)
- Event RSVP: view → RSVP → navigate away → navigate back → state persists
- Group join / leave
- DM creation and message send
- Job board search and application tracking

### Rules (until a dedicated `TESTING_STANDARDS.e2e.md` is written)

- Preamble rules apply: test behavior, no `.only`/`.skip` without comment, every contributor must understand the test.
- Use `getByRole` and `getByLabel` selectors. Fall back to `data-testid` only when no accessible selector exists.
- Tests that need auth credentials must `test.skip` when env vars are missing — never hardcode real credentials.
- No CI workflow yet. E2E tests are local-only. Manually run `npm run test:e2e` before merging auth or navigation changes.
