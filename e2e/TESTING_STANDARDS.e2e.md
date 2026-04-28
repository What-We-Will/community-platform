# Testing Standards — End-to-End (Playwright)

Load this file when writing, modifying, or reviewing Playwright E2E tests in `e2e/`. Assumes `TESTING_STANDARDS.preamble.md` (project root) is loaded.

**Last updated:** 2026-04-27 · **Applies to:** Playwright 1.59 · **Owner:** platform lead

This file follows Playwright's [official best practices](https://playwright.dev/docs/best-practices) with two project-specific narrowings, both documented inline below:
- No Page Object Model class hierarchy — fixtures + plain helpers only (see [File organization](#file-organization)).
- `page.route()` is reserved for non-deterministic third parties (see [Network and data](#network-and-data)).

---

## What E2E is for (and what it is not)

E2E covers multi-step flows that cross navigation, auth, and persistence — the bugs unit tests can't catch. If a test could be written as a unit or integration test, write it as one. E2E is the slowest and flakiest layer; reserve it for genuine user journeys.

**In scope for E2E:** routing decisions (proxy/middleware), auth state transitions, multi-page flows, real Supabase RLS behavior end-to-end, JS-driven UI that only behaves correctly when fully hydrated.

**Out of scope for E2E:** business logic in pure utilities, server-action input validation, component rendering details, CSS — all belong in Jest.

---

## Locator priority

Always prefer the locator that is closest to how a real user finds the element.

1. `getByRole(role, { name })` — first choice
2. `getByLabel(text)` — for form fields
3. `getByText(text)` — for non-interactive content
4. `getByPlaceholder(text)` — only when no label exists
5. `getByTestId(id)` — last resort, only when no semantic role exists

`getByAltText` and `getByTitle` (also part of Playwright's [seven built-in locators](https://playwright.dev/docs/locators)) are omitted from this list because they're rarely the right fit in this codebase. Use them at the same tier as `getByPlaceholder` when an image's `alt` or an element's `title` is genuinely the user-facing affordance.

**Never use:** CSS selectors, XPath, `:nth-child()`, or class-based queries. They break on refactor and test implementation, not behavior.

**Always pair `role` with `name:`** — `getByRole("link")` alone matches every link on the page. Use `{ name: "Donate", exact: true }` when the name could be ambiguous.

---

## Lint enforcement

Most rules in this doc are enforced automatically by [`eslint-plugin-playwright`](https://github.com/playwright-community/eslint-plugin-playwright), scoped to `e2e/**/*.spec.ts` in `eslint.config.mjs` (recommended config). It fails `npm run lint` on `page.waitForTimeout`, `expect(locator).toBeTruthy()`, missing `await` on `expect()`, `.only` left in code, and several other anti-patterns from this doc. If you find yourself disabling a rule, fix the underlying issue instead — the rules exist because they catch real flake.

---

## MCP-assisted authoring (recommended)

When writing a new spec, the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) lets you navigate the live page and verify each locator resolves to exactly one element **before** committing the spec. This catches strict-mode violations and stale role names at authoring time, not at test runtime. Recommended for any AI-assisted authoring; optional for contributors writing specs by hand.

Setup: `claude mcp add playwright npx @playwright/mcp@latest` (one-time).

Workflow:
1. `npm run dev`
2. Ask Claude (or your MCP-capable agent): "Use the Playwright MCP to inspect `<url>` and write a spec for `<feature>`. Verify each locator resolves to exactly one element before writing."
3. Run the spec to confirm it passes before committing.

**Alternative: Playwright codegen.** `npx playwright codegen <url>` opens a recorder that emits a spec using the same locator priority documented above (role/text/testid first). Useful as a starting scaffold for contributors not using MCP. The output still needs cleanup to match this doc's conventions before commit.

---

## Auto-waiting and timing

**Banned:** `page.waitForTimeout(ms)`. Hard-coded sleeps are the #1 cause of flake. There is no acceptable use case in this repo.

Use Playwright's auto-waiting matchers instead:

```ts
await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
await expect(page).toHaveURL(/\/dashboard/);
```

For genuine async waits, use intent-revealing APIs:

| Wait for | Use |
|---|---|
| Navigation to a specific URL | `page.waitForURL(predicate)` |
| Network response | `page.waitForResponse(predicate)` |
| Element to reach a state | `locator.waitFor({ state })` |
| A condition to settle | `expect.poll(() => …)` |

Don't `expect(locator).toBeVisible()` then immediately `locator.click()` — `click()` already auto-waits for actionability. The redundant assert is noise.

---

## Test isolation

**Default:** each test gets its own `page` fixture via Playwright's per-test isolation. Don't share state.

**Shared-page exception:** allowed only for read-only assertions on a static page (e.g., the anonymous landing-page header). Such blocks **must** declare their contract with `test.describe.configure({ mode: "serial" })` so Playwright keeps them on a single worker. See `e2e/landing/landing-page.spec.ts` for the canonical example.

Never share mutable state across tests. Never write a test that depends on the success of a prior test in the same file.

---

## State setup

**Set up via SQL or admin API, never via UI.** Driving the signup flow to create a test user is slow, fragile, and tests the wrong thing. Use Supabase's admin API or seed SQL.

**Credentials come from `requireE2ECredentials(key)`** in `e2e/fixtures/auth.ts`. Never hardcode credentials in spec files. The fixture already skips gracefully when env vars are missing — surface that skip in the test message.

**The `.env.e2e` boundary is non-negotiable.** Never run E2E against the shared preview, staging, or production Supabase project. Tests mutate user state. The README's setup walkthrough exists for exactly this reason.

The three canonical test users are:

| Key | State | Expected route |
|---|---|---|
| `APPROVED_ONBOARDED` | onboarded + approved | `/dashboard` |
| `UNAPPROVED_ONBOARDED` | onboarded + pending | `/pending-approval` |
| `UNONBOARDED` | not onboarded | `/onboarding` |

If a new spec needs a different state, prefer extending one of these via SQL inside the test setup over creating a fourth canonical user.

---

## Network and data

- **Don't mock first-party APIs.** That defeats the point of E2E. If you find yourself wanting to mock a server action, write a Jest integration test instead.
- **`page.route()` is only for non-deterministic third parties** (Stripe, external email APIs) — and only when their behavior would otherwise destabilize the test.
- **Use the `request` fixture for API-driven setup.** Faster and more reliable than driving a UI form to populate state.

---

## File organization

- All E2E specs live under `e2e/`. Never co-locate with source.
- Naming: `*.spec.ts` (enforced by `jest.config.mjs` scoping — see preamble rule 14).
- Organize by domain: `e2e/auth/`, `e2e/landing/`, `e2e/<feature>/`.
- One feature or user-flow concern per file.
- Soft cap: 150 lines per spec. Above that, split by user state or sub-flow.

Shared helpers live in `e2e/fixtures/` as plain functions. Don't introduce a Page Object class hierarchy — fixtures + Playwright's built-in locators cover this codebase's needs.

---

## Assertion rules

- Use Playwright's auto-waiting matchers: `toBeVisible()`, `toHaveText()`, `toHaveURL()`, `toHaveCount()`.
- **Never `expect(locator).toBeTruthy()`** — that asserts the locator object exists, not the element. Use `toBeVisible()`.
- Never catch an error and assert nothing — that hides the failure.
- Assert on user-visible outcomes (URL, visible text, element presence), not on implementation details (CSS classes, internal data attributes, generated IDs).

**Optional: [`expect.soft()`](https://playwright.dev/docs/test-assertions#soft-assertions)** — when checking several independent properties of the same view (e.g., a static page with five header elements), `expect.soft()` lets the test continue past a failure so you see all problems in one run. Don't use it for state transitions where a failed assertion invalidates the rest of the test.

---

## Optional: structuring long specs with `test.step()`

For specs with multi-step flows, wrap each step in [`test.step()`](https://playwright.dev/docs/api/class-test#test-step) so failures in the trace viewer show which step broke without scrolling through every action:

```ts
await test.step("Sign in as approved user", async () => { ... });
await test.step("Navigate to dashboard", async () => { ... });
```

Not required for short or single-action specs. Pays off most for the auth flows in `e2e/auth/`.

---

## Anti-patterns (do not do)

| Anti-pattern | Why it's banned | Use instead |
|---|---|---|
| `page.waitForTimeout(ms)` | Flake source | Auto-waiting matchers |
| CSS / XPath / `:nth-child()` | Brittle to refactor | `getByRole` + `name:` |
| Test order dependency | Breaks under parallel execution | Per-test isolation, explicit setup |
| Shared mutable page across tests | Race conditions, lost optimization without `serial` mode | Per-test `page` fixture, or `mode: "serial"` for read-only blocks |
| `expect(locator).toBeTruthy()` | Doesn't actually check element state | `toBeVisible()` |
| Mocking first-party APIs | Defeats the point of E2E | Jest integration test instead |
| UI-driven setup (signup, form fill) for state | Slow, fragile, tests the wrong thing | Admin API or seed SQL |
| Hardcoded credentials | Leaks into git, can't skip cleanly | `requireE2ECredentials` |
| `.skip` / `.only` without a comment | Silently disables coverage | Tracking comment + linked task |

---

## Scripts

See `e2e/README.md` for the canonical command list (default run, debug, headed, UI mode, reports, traces).
