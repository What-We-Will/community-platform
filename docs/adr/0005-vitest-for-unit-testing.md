# ADR-0005 — Vitest for unit and component testing

**Status:** Proposed 2026-06-05
**TL;DR:** The unit and component test suite runs on Vitest; Jest has been removed. Test file naming, mocking, and the per-file node-environment docblock carry over with a `jest.*` → `vi.*` rename.
**Author:** @tonyrosario
**Sponsoring Lead:** @tonyrosario

## Context

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

- **Coverage enforcement.** Thresholds are intentionally not set; the ≥80% `lib/` target in
  the standards docs stays aspirational while the baseline is low. When and whether to enforce
  a threshold and run coverage in CI is deferred until coverage rises.
- **Mutation testing runner.** The standards reference StrykerJS; the runner needs to move from
  `@stryker-mutator/jest-runner` to `@stryker-mutator/vitest-runner`. Not yet adopted.
