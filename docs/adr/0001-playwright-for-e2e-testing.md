# ADR-0001 — Playwright for end-to-end browser testing

**Status:** Accepted 2026-04-27
**TL;DR:** We adopt Playwright (chromium-only, in-repo `e2e/` directory) for end-to-end browser testing of multi-step flows that unit and integration tests cannot cover.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

Before this work shipped, the repo had no end-to-end browser testing. Unit and integration tests under Jest covered library code and individual server actions, but multi-step flows that cross navigation, auth state, and data — exactly the surface where bugs hide on a routing-heavy app — had no automated coverage.

Three forces made the gap untenable:

- **Routing complexity.** `proxy.ts` routes authenticated users by profile state (`is_onboarded`, `approval_status`). The combinations (unonboarded, pending approval, approved) interact with the auth flow and post-login destinations in ways unit tests structurally can't observe. Silent regressions in this layer were a known risk.
- **Manual walkthrough debt.** A single manual QA pass surfaced a number of findings across the platform. Many were multi-page state bugs caused by missing revalidation. Automated regression coverage was the only realistic path to keep that work from re-emerging.
- **Volunteer team, no dedicated QA.** With ~12 volunteers and three rotating leads, manual full-flow regression on every release is impractical. Coverage that only exists in someone's head is coverage that disappears when they take a week off.

## Decision

We adopt **Playwright** as the project's E2E browser testing framework, with the following shape:

- **Location:** `e2e/` at the repo root. Subdirectories by surface area (`landing/`, `auth/`, `fixtures/`).
- **Browsers:** chromium only. Two projects in `playwright.config.ts`: `chromium` (headless, CI default) and `chromium-headed` (local debugging, video on).
- **Auth:** test users created in each contributor's personal Supabase project. Credentials live in `.env.e2e` (gitignored). One user per profile state: approved, unapproved, unonboarded.
- **Smoke subset:** specs tagged `@smoke` run via `npm run test:e2e:smoke` without the full test-user setup — for quick local sanity checks and for contributors not touching auth flows.
- **Retries:** 2 on CI, 1 locally. Trace captured on first retry; screenshots on failure.
- **CI integration, seed automation, and storageState reuse** are deferred to follow-ups, not part of this decision's scope.

## Alternatives considered

**Cypress.** Mature alternative with a strong UX. Rejected on two grounds: (1) Playwright's parallel execution and worker model is meaningfully faster on a multi-state suite like ours; (2) Playwright ships an MCP server enabling AI-assisted test authoring (`@playwright/mcp`), which matters for a small team where any contributor productivity multiplier compounds. Both are credible choices — this one wasn't a landslide.

**Selenium / WebDriver-based frameworks.** Rejected as legacy. Brittler API, slower runs, more setup, no upside for a greenfield adoption.

**Jest + jsdom for "integration-ish" coverage instead of E2E.** What we already use for unit/integration tests. Rejected for E2E specifically: jsdom isn't a real browser. It can't catch CSS bugs, real navigation behavior, real network sequencing, or rendering issues. Jest stays for unit/integration; E2E is a separate concern with separate tooling.

**Manual regression QA only.** What we had been doing implicitly. Rejected because (a) volunteer scheduling can't sustain it, (b) manual walkthrough findings demonstrated existing regression debt, and (c) even partial automated coverage catches more than zero.

**Cross-browser coverage (Firefox + WebKit).** Rejected for now. Our audience skews chromium (Chrome, Edge, Brave). Adding browsers triples CI runtime and surfaces cross-browser flake without proportional value at our current user base. Revisit if real users report Firefox/Safari issues.

**Visual regression testing (screenshot diffing).** Rejected for now. Overkill at current UI maturity; introduces flake from font rendering and anti-aliasing differences across environments. Revisit once the design system stabilizes.

## Consequences

**What this enables:**

- Multi-step flows (auth routing, onboarding, approval gates) are regression-testable.
- Manual-walkthrough debt has somewhere to migrate as automated coverage accrues.
- AI-assisted test authoring is practical via Playwright MCP.
- A `@smoke` subset keeps the harness usable for contributors who haven't done the full test-user setup yet.

**What this constrains:**

- PRs touching auth flows, navigation, or member-facing pages are expected to add or update an E2E spec. "Unit-tests-only" coverage in those areas may receive review pushback.
- Auth-gated specs require ~30 min of one-time per-contributor setup (personal Supabase project, three test users, `.env.e2e`). Addition of a seed database script is the planned mitigation.
- CI integration will add runtime to PR checks and a small infra cost (dedicated test Supabase project, secrets management).

**New work this creates:**

- CI integration. Open: gate-merge vs informational, secrets strategy, DB strategy.
- Idempotent script to seed required test users. Replaces the manual SQL block in `e2e/README.md` Step 3.
- `storageState` reuse for auth cookies. Gated on auth-gated test count growing past ~5.
- Node engines pin (≥ 20.12 for `process.loadEnvFile`). Pending lead decision.

**Risks:**

- **Flake.** E2E is inherently flakier than unit tests. Mitigated by `retries: 2` on CI plus on-first-retry traces. Risk: a chronically flaky test masks a real bug. Mitigation: take flake reports seriously; investigate before blanket-skipping.
- **Local/CI environment drift.** Each contributor's personal Supabase project can drift in user state, producing "works on my machine" failures. Seed script will directly address this.
- **DOM coupling during UI refactors.** Specs tied to CSS selectors break when markup changes. Mitigation: prefer accessibility-based locators (role, label) over CSS; documented in `e2e/README.md`.

**Workflow change for contributors:** documented in `e2e/README.md`. Quick version: run `npm run test:e2e` locally before opening PRs that touch auth or navigation; use `npm run test:e2e:smoke` for fast checks without test-user setup.

## Open questions

- **Gate-merge or informational in CI?** Recommendation: start informational, promote to gate-merge once the suite is stable in CI for ~2 weeks.
- **Cross-browser trigger.** Currently chromium-only. What signal would justify adding Firefox or WebKit? Open until we hear it from a real user.
- **Visual regression trigger.** Currently skipped. Revisit when the design system stabilizes — likely tied to a future component-library or theming initiative.
