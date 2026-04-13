# Testing Decisions

Open design questions the team needs to resolve before `TESTING_STANDARDS.md` is finalized. Each section includes the question, the tradeoffs, and a recommendation from the platform lead. Decisions should be made and recorded here before the standards doc is merged.

---

## 1. Jest or Vitest?

**Status:** Open

### Context

The project currently uses Jest 29 with the `next/jest` SWC wrapper. Next.js 16 officially supports both Jest and Vitest. The question is whether to migrate now — before investing in ~95 new test files — or stay on Jest.

### The case for migrating to Vitest now

**`next/jest` has a known, unfixed ESM problem.** The wrapper [hardcodes `/node_modules/` into `transformIgnorePatterns`](https://github.com/vercel/next.js/issues/35634) and your config cannot override it. The moment you add any ESM-only dependency (increasingly common), you get `Unexpected token 'export'` and need an async config hack. This has been open since 2022.

**Other technical advantages:**
- Native TypeScript and ESM — no SWC transform layer to misconfigure
- `vitest.config.ts` with standard Vite plugins vs. `jest.config.mjs` with the `next/jest` wrapper
- HMR-aware watch mode (re-runs only affected tests)
- StrykerJS has an official `@stryker-mutator/vitest-runner`
- Community direction is clear — new Next.js App Router projects overwhelmingly default to Vitest

**Migration cost is low right now:**
- 14 test files, mechanical `jest.*` → `vi.*` replacements
- A codemod handles most of it (`npx codemod@legacy jest/vitest`)
- `@testing-library/react` and `@testing-library/jest-dom` work unchanged
- Supabase mock factories already use named exports — no rewrite needed
- Estimated effort: 2-4 hours

### The case for staying on Jest

- The current setup works. 147 tests pass. Nothing is broken today.
- Jest is more familiar to a wider range of contributors.
- Migration introduces churn on a branch that's already large (Plan 007).
- `next/jest` is still officially maintained by the Next.js team.

### What Vitest does NOT solve

- **Async Server Components** — neither runner supports them. This is a React limitation, not a test runner one.
- **Better mocking of `next/headers`, `next/cache`, `next/navigation`** — `vi.mock()` and `jest.mock()` are functionally equivalent.
- **Speed** — at 14 test files, both run in under 2 seconds.

### What changes in the migration

| Before (Jest) | After (Vitest) |
|---|---|
| `jest.mock(...)` | `vi.mock(...)` |
| `jest.fn()` | `vi.fn()` |
| `jest.Mock` (type) | `Mock` from `vitest` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `@jest-environment node` docblock | `// @vitest-environment node` comment |
| `jest.config.mjs` + `next/jest` | `vitest.config.ts` + `@vitejs/plugin-react` + `vite-tsconfig-paths` |
| `@types/jest` | Removed (Vitest ships its own types) |
| `jest.setup.ts` | `vitest.setup.ts` (same content) |

### Recommendation

Migrate now. The `transformIgnorePatterns` issue is a ticking time bomb, the cost is trivially low at 14 files, and every new test written in Jest is a test migrated later. If the team decides to migrate, add a Step 0 to Plan 007 before writing new tests.

### Decision

_To be filled in by the team._

---

## 2. pgTAP for RLS testing — contributor requirement or maintainer-only?

**Status:** Open

### Context

`TESTING_STANDARDS.md` requires a pgTAP test for every migration that adds or modifies an RLS policy. pgTAP runs via `supabase test db`, which requires Docker and a local Supabase instance.

### Option A: All contributors

- Every contributor who touches RLS must write and run pgTAP tests locally.
- Raises the contributor onboarding bar (Docker + Supabase CLI required).
- Strongest security posture — the person writing the policy also verifies it.

### Option B: Maintainer-only

- Contributors write the migration SQL. A maintainer writes or reviews the pgTAP test.
- Lower contributor barrier. Keeps the project accessible to less-experienced contributors.
- Risk: pgTAP tests lag behind migrations if maintainers are bottlenecked.

### Option C: Required in CI, optional locally

- pgTAP tests are required to pass in CI before merge. Contributors can write them locally if they have Docker, but CI is the gate.
- Best of both worlds, but requires CI infrastructure that doesn't exist yet.

### Recommendation

Start with Option B (maintainer-only) to keep the contributor bar reasonable. Move to Option C when CI infrastructure is in place. Document clearly in `TESTING_STANDARDS.md` which responsibility falls where.

### Decision

_To be filled in by the team._

---

## 3. Playwright — when, what, and who?

**Status:** Open

### Context

`TESTING_STANDARDS.md` lists 5 critical E2E flows (auth, RSVP, group join/leave, DM creation, job board). Neither Jest nor Vitest can test async Server Components — E2E is the only option for these flows.

### Questions to resolve

1. **When does Playwright get prioritized?** It's not in Plan 007. Is it the next plan, or deferred until after coverage targets are met?
2. **Which flows are truly E2E vs. testable at the server action level?** Some listed flows (RSVP, group join) might be adequately covered by server action tests with mocked Supabase.
3. **Who owns the E2E suite?** All contributors, or platform lead only?
4. **What environment does it run against?** Local Supabase? A shared staging instance? Seeded test data?

### Recommendation

Defer Playwright to a dedicated plan after Plan 007. Focus Plan 007 on unit/integration coverage. When Playwright is introduced, start with auth flow only (highest risk, hardest to test any other way) and expand from there.

### Decision

_To be filled in by the team._

---

## 4. Writer/Reviewer pattern — hard rule or guidance?

**Status:** Open

### Context

`TESTING_STANDARDS.md` says "never accept test + implementation in the same AI response." This follows Anthropic's best practices to prevent confirmation bias. But it doubles the number of AI interactions for every change.

### Option A: Hard rule for all code

- Maximum rigor. Every test and implementation is produced in separate AI sessions.
- Slower workflow. Contributors may find it frustrating for trivial changes.
- Enforcement: PR reviewers would need to ask how the test was produced.

### Option B: Hard rule for security-critical paths only

- Required for: auth, RLS policies, data mutations, server actions that touch user data.
- Guidance (not required) for: utility functions, UI components, formatting helpers.
- Pragmatic balance. The areas where AI confirmation bias is most dangerous get the rigor.

### Option C: Guidance only

- Recommended but not enforced. Trusts contributors to use good judgment.
- Weakest safeguard. Likely to be ignored under time pressure.

### Recommendation

Option B. The Writer/Reviewer pattern matters most where the consequences of a bad test are highest. Requiring it for `lib/utils/format.ts` is overhead; requiring it for `lib/supabase/proxy.ts` is essential.

### Decision

_To be filled in by the team._

---

## 5. Test file size limit — is 150 lines right?

**Status:** Open

### Context

`TESTING_STANDARDS.md` caps test files at 150 lines. Some modules have complex setup — `fetchRecentConversations` involves 4+ sequential Supabase calls across different tables. Even with factory functions, the test file may need more room.

### Arguments for 150

- Forces splitting by behavior group, which improves readability.
- Keeps test files scannable — you can read the whole file without scrolling.
- "Split the file" is always an option: `conversations.fetch.test.ts`, `conversations.unread.test.ts`.

### Arguments against 150

- Complex modules with many edge cases may need 180-200 lines even with factories.
- Splitting a single function's tests across files can reduce cohesion.
- An arbitrary number creates busywork when a file hits 155 lines.

### Alternatives

- Raise to 200 lines.
- Keep 150 as the target, allow exceptions with a comment explaining why.
- Drop the hard number entirely and use "split when the file tests more than one behavior group" as the rule.

### Recommendation

Keep 150 as the default. Allow exceptions with a `// exceeds-150: [reason]` comment at the top of the file. This preserves the forcing function while acknowledging that some modules are genuinely complex.

### Decision

_To be filled in by the team._

---

## 6. Property-based testing — now or later?

**Status:** Open

### Context

`TESTING_STANDARDS.md` recommends [fast-check](https://fast-check.dev/) for `lib/utils/` functions. Property-based testing generates randomized inputs to surface edge cases that hand-written examples miss. This is especially valuable when AI writes the implementation.

### Arguments for adding now

- `lib/utils/` is the ideal target: pure functions, meaningful input ranges (dates, strings, timezone identifiers).
- Catches the "safe path" trap where AI writes tests that only cover the happy path.
- `fast-check` has strong TypeScript support and integrates with both Jest and Vitest.

### Arguments for deferring

- New dependency and unfamiliar testing pattern for most contributors.
- The current `lib/utils/` test suite (6 files) already has good example-based coverage.
- Adds cognitive load to the standards doc for a technique few will use immediately.

### Recommendation

Add `fast-check` as a devDependency now. Make it "recommended" (not required) for `lib/utils/`. Include one example in the standards doc so contributors see the pattern. Upgrade to "required" after the team has used it on 2-3 modules and validated the workflow.

### Decision

_To be filled in by the team._

---

## 7. Mutation testing targets — what are the right numbers?

**Status:** Open

### Context

`TESTING_STANDARDS.md` sets mutation score targets: 70% for critical paths, 50% for standard features. These are borrowed from industry benchmarks, not measured against this codebase.

### The problem

Without running StrykerJS against the existing 147 tests, we don't know the baseline. The targets could be trivially easy or impossibly hard. Committing to numbers before measuring is guessing.

### Recommendation

1. Run StrykerJS against the current test suite to establish a baseline mutation score.
2. Set targets based on what's achievable with reasonable effort above that baseline.
3. Start mutation testing on critical paths (auth, RLS, data mutations) immediately — don't wait for 80% line coverage across all of `lib/`.

### Decision

_To be filled in by the team._

---

## 8. "Every contributor must understand every test" — how do you enforce it?

**Status:** Open

### Context

`TESTING_STANDARDS.md` says tests should not be accepted if the contributor can't explain them. This is a response to [research showing](https://dev.to/dmitry_turmyshev/quality-assurance-in-ai-assisted-software-development-risks-and-implications-34kk) that AI-generated test suites often outpace team understanding, leading to tests nobody can maintain.

### Enforcement options

| Option | Mechanism | Cost |
|---|---|---|
| PR review question | Reviewer asks "what does this test verify?" on at least one test per PR | Low — but easily skipped |
| Inline intent comment | Each `describe` block gets a one-line `// Verifies: [what and why]` comment | Low — but can become boilerplate |
| Pair review for AI-generated tests | Any test written with AI assistance gets reviewed synchronously, not async | High — but most effective |
| Honor system | Trust contributors to follow the standard | Zero cost — zero enforcement |

### Recommendation

Require a one-line intent comment on each `describe` block: `// Verifies: [behavior being tested and why it matters]`. This is lightweight, self-documenting, and gives reviewers something concrete to check. If the contributor can't write the comment, they don't understand the test.

### Decision

_To be filled in by the team._

---

## 9. Forbidden patterns — does the team agree?

**Status:** Open

### Context

`TESTING_STANDARDS.md` bans: `any` type, `@ts-ignore` without justification, `setTimeout`/`sleep`, snapshot tests, `console.log`, and testing getters/setters.

### Likely pushback

- **`any` in test files:** Test doubles are awkward to type. The Supabase client mock returns deeply nested chains. Some contributors will argue that `as any` is pragmatic in test files.
- **Snapshot tests:** Useful for catching unintended UI changes in component tests. A blanket ban may be too strict.

### Recommended escape hatches

- `any` ban stays. Use `as unknown as SomeType` for type assertions in test doubles. If the mock type is too complex, the mock is too complex — simplify it or use `buildMockSupabaseClient()`.
- Snapshot tests remain banned by default. Require explicit platform lead approval per file. Approval is granted when: the component has stable output, the snapshot is small (< 30 lines), and the test also includes behavioral assertions.

### Decision

_To be filled in by the team._

---

## How to use this document

1. Read each section.
2. Discuss as a team (async in Slack or sync in a meeting).
3. Fill in the "Decision" field with the outcome and date.
4. Update `TESTING_STANDARDS.md` to reflect the decisions.
5. Archive this file or move it to `plans/local/` once all decisions are made.

---

*This document is temporary. Once decisions are recorded and applied to `TESTING_STANDARDS.md`, it should be archived.*
