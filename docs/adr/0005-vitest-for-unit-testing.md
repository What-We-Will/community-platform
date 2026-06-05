# ADR-0005 — Vitest for unit and component testing

**Status:** Proposed 2026-06-05 <!-- RETROACTIVE record of a decision agreed in PR #43. Flips to "Accepted <date>" at merge. -->
**TL;DR:** The unit and component test suite runs on Vitest; Jest has been removed. Test file naming, mocking, and the per-file node-environment docblock carry over with a `jest.*` → `vi.*` rename.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

<!--
FILE NAME

Save this file as `docs/adr/NNNN-kebab-case-title.md`, where:
  - NNNN is the next available 4-digit number, zero-padded (0001, 0002, …, 0042).
  - kebab-case-title is a short, lowercase, hyphen-separated slug of the title.
    Aim for 3–6 words. Drop articles ("the", "a"), drop "use" / "adopt" / "we"
    where it doesn't change meaning.

Examples:
  docs/adr/0001-supabase-vault-for-survey-keys.md
  docs/adr/0002-rls-fixtures-via-seed-id.md
  docs/adr/0003-jitsi-for-video.md

Numbers are permanent. If an ADR is superseded, the old file keeps its number
and gains a "Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)" status line;
the new ADR takes the next unused number. Numbers are never reused.

HEADER FIELDS

Status:
  - "Draft YYYY-MM-DD" while the author is still scribbling and not yet ready
    for sponsorship review. Draft lives on a branch or fork — do not land
    Draft on main. Open the PR when flipping to Proposed.
  - "Proposed YYYY-MM-DD" once the ADR is open for lead review (in PR).
  - "Accepted YYYY-MM-DD" when the decision is accepted. For new ADRs, this is
    usually the merge date. For retroactive ADRs, this is the implementing PR's
    merge date or a documented sign-off, whichever came first.
  - "Rejected YYYY-MM-DD" when the proposal is reviewed and not adopted. Merge
    with this status when the debate is worth preserving as a record; otherwise
    close the PR without merging.
  - "Superseded YYYY-MM-DD by [ADR-NNNN](./NNNN-...)" when a later ADR replaces
    this one.
  - "Deprecated YYYY-MM-DD" when no longer applies and there is no replacement.
    (Rare; usually decisions get superseded, not deprecated.)

TL;DR: One sentence by default; up to three when the decision has multiple
  parallel parts (e.g., several adoptions plus a deferral). Plain language.
  Lead with what's adopted; state the decision, not the reasoning. Defer
  rationale to Context and Decision.

Author: Whoever drafted the ADR. Can be a volunteer or a lead. Authorship is
  not erased when a Sponsoring Lead attaches their name.

Sponsoring Lead: A platform lead who has attached their name to this ADR.
  This is the permanent record contact — the person a future contributor or
  lead asks "why did we decide this?" years from now. The role stays with the
  same lead when they rotate between project areas. Reassign only when the
  original sponsor is no longer an appropriate project contact.

  A volunteer proposing an ADR may leave this field with the @username
  placeholder; one of the three platform leads will fill in their name
  during PR review. Do not delete the line.

Before merging, strip ALL HTML comments from this file — including this top
block and the comments inside each body section. They are authoring
scaffolding, not part of the decision record. The merged ADR should be
prose only.

After an ADR is merged as `Accepted`, the only allowed edits are status
transitions, non-substantive corrections such as typos or broken links, or
metadata corrections that do not change the decision record. For substantive
changes, write a new ADR that supersedes this one.
-->

## Context

<!--
What's the situation that requires a decision? What forces are at play —
technical constraints, organizational constraints, contributor reality?
Be specific. Future readers will not have the context you have today.

Aim for 2–4 paragraphs. Don't editorialize; describe the situation.
-->

The unit and component test suite ran on Jest 29 wired through `next/jest`, with a
jsdom default environment and a per-file `@jest-environment node` docblock for
server-side code. The `TESTING_STANDARDS.*` documents codified the project's testing
conventions explicitly against Jest. End-to-end browser testing is a separate concern,
already settled on Playwright in [ADR-0001](./0001-playwright-for-e2e-testing.md); this
decision covers only the unit/component layer.

Jest with `next/jest` carried ongoing friction: ESM/TypeScript interop rough edges, a
transform layer separate from the app's Vite-compatible tooling, and slower cold runs.
During the testing-standards discussion in PR #43, the team agreed to move the unit
runner to Vitest — Vite-native, ESM-first, faster, and offering a Jest-compatible
assertion and mocking API that keeps the migration largely mechanical.

The decision was reached in that PR but never recorded as an issue or ADR. It was later
implemented on the `feature/jest-to-vitest` branch (migration `888e425`, plus follow-up
fixes `838e0b9` and `d98790d`). This ADR is the retroactive record so the rationale and
tradeoffs survive the loss of the PR-thread context.

## Decision

<!--
What did we decide? State it in one or two sentences at the top, then
elaborate as needed.

Use active voice: "We will use X" not "It was decided that X might be used."

Free-form prose. This is not a prescribed action list — implementation
steps belong in Consequences or a separate runbook.
-->

We use **Vitest** as the unit and component test runner and remove Jest entirely.
The migration preserves the existing test conventions wherever possible:

- The Jest-compatible API means test bodies change mechanically: `jest.*` → `vi.*`,
  and `jest.MockedFunction` / `jest.Mock` become type imports from `vitest`.
- File naming is unchanged: `*.test.ts(x)` for unit/component tests; `*.spec.ts`
  stays reserved for Playwright E2E under `e2e/`. The Vitest `include` is scoped so the
  two runners never cross-pick each other's files.
- The per-file environment docblock carries over as `@vitest-environment node`, with a
  jsdom default for component tests.
- Path aliases (`@/*`) are resolved via an explicit `resolve.alias` in `vitest.config.ts`,
  because Vite does not read `tsconfig.json` path mappings by default.
- Coverage is provided by `@vitest/coverage-v8` and is **reporting-only** — no thresholds
  gate the run or CI (see Open questions).

The operational details of these conventions live in the `TESTING_STANDARDS.*` documents,
which were updated from "Jest 29" to "Vitest 4" as part of the migration.

## Alternatives considered

<!--
What other options were on the table, and why were they rejected?

Be honest — "we didn't have time to evaluate Y" is a valid rejection reason
and worth recording. Future readers may have time to revisit.

For each alternative: 1–3 sentences describing it, then 1–2 sentences on
why it wasn't chosen.

This is the highest-value section for future readers. Don't skimp.
-->

**Stay on Jest 29.** The incumbent: stable, ubiquitous, well-understood, already wired via
`next/jest`. Rejected because the recurring ESM/TS friction and slower runs were the
motivating pain, and the Jest-compatible Vitest API made the switching cost low enough that
keeping Jest mainly to avoid a migration wasn't compelling.

**Node's built-in test runner (`node:test`).** Zero extra test-runner dependency and fast.
Rejected because its React Testing Library / jsdom integration is less mature and it lacks
the Jest-compatible mocking/assertion surface, which would have turned a mechanical rename
into a substantial rewrite of every test.

**Bun's test runner.** Very fast with a Jest-like API. Not evaluated in depth — adopting it
would introduce Bun as a runtime/toolchain dependency, and its maturity for Next.js + RTL
component testing was an unknown we didn't have time to derisk. Recorded as a possible future
revisit rather than a considered-and-rejected option.

## Consequences

<!--
What does this decision make true? Both the good (what we gain) and the
bad (what we now have to live with).
-->

- **Faster test runs** and a test toolchain aligned with the Vite-compatible ecosystem.
- **Migration was largely mechanical** thanks to the Jest-compatible API — the bulk of the
  diff is `jest.*` → `vi.*` across ~22 test files. The suite (239 tests) passes post-migration.
- **New config surface:** `vitest.config.ts`, `vitest.setup.ts`, `vitest.d.ts` replace
  `jest.config.mjs` / `jest.setup.ts`.
- **Path aliases are now a maintained config concern.** Because Vite ignores `tsconfig.json`
  paths, `@/*` resolution depends on `resolve.alias` in `vitest.config.ts`. The migration
  initially shipped an invalid `resolve: { tsconfigPaths: true }` (not a real Vite option),
  which silently broke every `@/*` import until it was replaced with an explicit alias. Future
  config changes here must be verified by an actual test run, not by inspection.
- **Coverage is available** via `npm run test:coverage` (`@vitest/coverage-v8`), reporting-only.
- **Contributor workflow changes:** `npm test` runs Vitest; server-side test files use the
  `@vitest-environment node` docblock instead of `@jest-environment node`.
- **Docs debt paid down:** `TESTING_STANDARDS.*` now describe Vitest rather than Jest.

## Open questions

<!--
Optional. Things we deliberately deferred, or aspects of the decision we're
not yet sure about. If there are none, delete this section.
-->

- **Coverage enforcement.** Thresholds are intentionally not set; the ≥80% `lib/` target in
  the standards docs stays aspirational while the baseline is low. When and whether to enforce
  a threshold and run coverage in CI is deferred until coverage rises.
- **Mutation testing runner.** The standards reference StrykerJS; the runner needs to move from
  `@stryker-mutator/jest-runner` to `@stryker-mutator/vitest-runner`. Not yet adopted.
