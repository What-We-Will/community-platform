# Testing Standards — Preamble

Loaded in every testing-related session. Rules 1–13 apply to Jest unit/integration tests. Rule 14 is cross-cutting (Jest + Playwright). For Playwright E2E specs in `e2e/`, also load `e2e/TESTING_STANDARDS.e2e.md` for E2E-specific rules.

**Last updated:** 2026-04-27 · **Applies to:** Jest 29 (rules 1–13), Jest + Playwright (rule 14) · **Owner:** platform lead

---

## Non-negotiable rules

1. **Tests are mandatory; TDD is strongly encouraged.** Every feature and bug fix must have tests that meet our coverage and quality standards. Red-green-refactor is the recommended workflow — especially for bug fixes, where writing the failing test first proves the bug exists and the fix works. Coverage thresholds and the pre-merge checklist are the enforcement mechanism, not workflow policing.

2. **Test behavior, not implementation.** Assert on return values and observable side effects. Do not assert on internal call sequences, intermediate state, or implementation details.

3. **Litmus test.** If a refactor changes zero behavior but breaks a test, the test was wrong.

4. **Mock boundaries only.** Never mock internal functions or utilities from `lib/utils/`. Mock only: Supabase client, `next/headers`, `next/cache`, `next/navigation`, `fetch`, and environment variables.

5. **Use factory functions.** All test data comes from `lib/__tests__/factories.ts`. Never construct test objects inline.

6. **Use `buildMockSupabaseClient()`.** All Supabase mocking uses `buildMockSupabaseClient()` from `lib/__tests__/supabase-mock.ts`. No exceptions.

7. **AAA layout.** Every test uses Arrange / Act / Assert with a blank line between each section.

8. **Naming.** Test cases: `it("should [expected outcome] when [condition]")`. Describe blocks match the exported function name.

9. **`jest.clearAllMocks()` in `beforeEach`.** Not `afterEach` — a failing test can skip afterEach cleanup. Required in any file that uses mocks.

10. **Test the unauthenticated case.** Every server action and data helper must have a test asserting it returns an error or redirects when called without a valid session.

11. **No `.only` or `.skip` in committed code** without a tracking comment explaining why.

12. **`npm test` must pass** before any PR.

13. **Every contributor must understand every test.** The `describe` block should clearly document the feature or behavior under test — not mirror the function name. A reviewer should be able to read the `describe` block and `it` descriptions alone and understand the intent and what's being validated. If that's not possible without re-reading the AI conversation that produced it, the test isn't ready for review.

14. **Test file naming.** Jest unit/integration tests use `*.test.ts(x)`. The `*.spec.ts` extension is reserved for Playwright E2E tests in `e2e/` — see `e2e/TESTING_STANDARDS.e2e.md` for E2E-specific standards. Don't use `*.spec.ts` for Jest tests, even though Jest's defaults would match it — `jest.config.mjs` is explicitly scoped to `*.test.ts(x)` so a misnamed Jest test will be silently skipped. This convention prevents Jest and Playwright from cross-picking each other's files.
