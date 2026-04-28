# E2E Tests

Playwright tests covering the landing page and authenticated user flows.

## Running

E2E ("end-to-end") tests drive a real browser through the app the way a user would — clicking, typing, and waiting for pages to render. Use them to verify multi-step flows that cross navigation, auth, and data (the kinds of bugs unit tests can't catch). New to Playwright? Start with their [Writing tests](https://playwright.dev/docs/writing-tests) intro.

**Default:** `npm run test:e2e`. It's the fastest and what CI runs — reach for `:debug` when a test is failing and you need to see why.

| Command                  | What it does                      | When to use it                                       |
| ------------------------ | --------------------------------- | ---------------------------------------------------- |
| `npm run test:e2e`       | Headless, chromium only           | **Default.** Everyday runs and CI.                   |
| `npm run test:e2e:debug` | Launches the Playwright Inspector | Step through a failing test line-by-line             |

The dev server starts automatically (`reuseExistingServer: true`) — if `npm run dev` is already running, it'll reuse it.

### Other Playwright modes

These aren't wired up as npm scripts because they're situational, not routine. Use them directly:

- **Watch a single test in a real browser:**
  ```bash
  npx playwright test e2e/auth/login-approved.spec.ts --headed
  ```
  Useful when a test is doing something surprising and you want to see it. Don't run the whole suite headed — it opens a browser per worker and is unwatchable.

- **Author or explore tests interactively:**
  ```bash
  npx playwright test --ui
  ```
  Playwright's UI mode — pick locators, re-run individual specs, time-travel through actions. Worth learning if you're writing new E2E tests; overkill if you just want to run them.

- **AI-assisted test authoring (Claude Code / MCP-capable agents):**
  ```bash
  claude mcp add playwright npx @playwright/mcp@latest
  ```
  Installs the official [Playwright MCP server](https://github.com/microsoft/playwright-mcp), letting an AI agent drive a real browser to inspect the live DOM, pick locators, and verify selectors while writing tests. Optional — only useful if you use Claude Code or another MCP-capable agent.

## Reports & artifacts

After a run, view the HTML report:

```bash
npx playwright show-report
```

Artifacts captured per-test (when applicable) live under `test-results/<test-name>/`:

| Artifact     | When it's captured                                            |
| ------------ | ------------------------------------------------------------- |
| Screenshots  | On failure (both `chromium` and `chromium-headed`)            |
| Videos       | **Only** in `npm run test:e2e:headed` — the default run records none |
| Traces       | On first retry (open with `npx playwright show-trace <file>`) |

Both `test-results/` and `playwright-report/` are gitignored.

## First-time setup

The auth specs need real users in **your own Supabase project**. Never point these at the shared preview or production environments.

### 1. Point your local app at your own Supabase project

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` to your personal project. If you don't have one, create a free project at [supabase.com](https://supabase.com), run the migrations in `supabase/migrations/` against it, and use those credentials.

### 2. Create the three test users via the signup flow

Run `npm run dev`, go to `/signup`, and create:

| Purpose      | Email                                       |
| ------------ | ------------------------------------------- |
| Approved     | `you+e2e-approved@example.com`              |
| Unapproved   | `you+e2e-unapproved@example.com`            |
| Unonboarded  | `you+e2e-unonboarded@example.com`           |

Use any password you'll remember — you'll put them in `.env.e2e` next.

> Use a `+suffix` on a real address you control, or your dashboard's email provider settings. The signup flow may require email confirmation depending on your project's auth settings.

### 3. Set the correct profile + auth state

The `handle_new_user` trigger creates a profile row on signup with default state. Each test user needs an explicit profile state so the test isn't coupled to whatever the trigger defaults happen to be. Run this in the Supabase SQL editor:

```sql
-- Confirm all three emails so sign-in works
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email IN (
  'you+e2e-approved@example.com',
  'you+e2e-unapproved@example.com',
  'you+e2e-unonboarded@example.com'
)
AND email_confirmed_at IS NULL;

-- Approved user: onboarded + approved, proxy routes to /dashboard
UPDATE public.profiles
SET is_onboarded = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'you+e2e-approved@example.com');

-- Unapproved user: onboarded so the approval gate is what blocks them, proxy routes to /pending-approval
UPDATE public.profiles
SET is_onboarded = true,
    approval_status = 'pending'
WHERE id = (SELECT id FROM auth.users WHERE email = 'you+e2e-unapproved@example.com');

-- Unonboarded user: not onboarded, proxy routes to /onboarding (set explicitly so the test isn't relying on trigger defaults)
UPDATE public.profiles
SET is_onboarded = false,
    approval_status = 'approved'
WHERE id = (SELECT id FROM auth.users WHERE email = 'you+e2e-unonboarded@example.com');
```

**Why these states?** The `proxy.ts` router checks `is_onboarded` first, then `approval_status`. So:

- `is_onboarded=false` → routes to `/onboarding` (approval doesn't matter)
- `is_onboarded=true, approval_status='pending'` → routes to `/pending-approval`
- `is_onboarded=true, approval_status='approved'` → routes to `/dashboard`

### 4. Configure `.env.e2e`

```bash
cp .env.e2e.example .env.e2e
```

Fill in the six values with the emails and passwords from step 2. `.env.e2e` is gitignored — never commit it.

### 5. Run the tests

```bash
npm run test:e2e
```

Expect **12 passed**. If the auth specs skip, your `PW_E2E_*` env vars aren't being picked up — check that `.env.e2e` is in the repo root.

## Troubleshooting

**"Email not confirmed"** — re-run the `email_confirmed_at` UPDATE from step 3.

**Approved user lands on `/onboarding`** — `is_onboarded` is still `false`. Re-run that UPDATE.

**Unapproved user lands on `/dashboard`** — `approval_status` got reset to `'approved'`, or `is_onboarded` is `false` (which routes to `/onboarding` instead). Verify both columns.

**Tests hang on "Signing in..."** — usually means sign-in is failing silently with an error the fixture doesn't recognize. Run with `--headed` to see what the page is doing.

## Layout

```
e2e/
├── auth/         # auth-state specs (one per user state)
├── fixtures/     # shared helpers (loginWithPassword, etc.)
└── landing/      # anonymous landing-page specs
```
