# Testing Standards — Preamble

Loaded in every testing-related session. All rules below apply regardless of task type.

**Last updated:** 2026-03-29 · **Applies to:** Jest 29 · **Owner:** platform lead

---

## Non-negotiable rules

1. **TDD is mandatory.** Every feature and bug fix follows red-green-refactor: write a failing test first, write the minimum implementation to pass it, then refactor without changing behavior.

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

13. **Every test must be explainable** without re-reading the AI conversation that produced it. If you cannot explain what a test verifies and why it matters, it is not ready for review.
