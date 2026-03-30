# Testing Standards — Implementation

Load this file when writing or generating test code. Assumes preamble is loaded.

**Last updated:** 2026-03-29 · **Applies to:** Jest 29 · **Owner:** platform lead

---

## Boundaries

### What is mockable

| Boundary | Mock with |
|---|---|
| Supabase client | `buildMockSupabaseClient()` from `lib/__tests__/supabase-mock.ts` |
| `next/headers` (cookies) | `jest.mock("next/headers")` |
| `next/cache` (revalidatePath) | `jest.mock("next/cache")` |
| `next/navigation` (redirect) | `jest.mock("next/navigation")` |
| External HTTP APIs (Action Network, etc.) | `jest.spyOn(global, "fetch")` |
| Environment variables | `process.env` override in `beforeEach` / `afterEach` |

### What is not a boundary (do not mock)

- Functions in the same module
- Utility functions from `lib/utils/`
- Type constructors, enums, or constants

---

## Layer conventions

| Source location | Test approach | Mocking allowed | Property-based |
|---|---|---|---|
| `lib/utils/*.ts` | Pure unit tests. No mocks. | None | Recommended (fast-check) |
| `lib/*.ts` (data helpers) | Mocked Supabase client | `jest.mock("@/lib/supabase/server")` | Where applicable |
| `lib/actions/*.ts` | Mocked Supabase + external deps | Supabase client + external APIs | No |
| `lib/supabase/*.ts` | Mocked cookies + Supabase auth | `next/headers`, Supabase client | No |
| `components/**/*.tsx` | React Testing Library | Supabase, `next/navigation`, server actions | No |
| `supabase/tests/*.sql` | pgTAP against real database | None — tests real RLS policies | No |

### Property-based testing (`lib/utils`)

Use [fast-check](https://fast-check.dev/) to supplement example-based tests for pure utility functions. Add it when the utility has meaningful input ranges (dates, strings, numbers). Skip for simple lookups or config maps.

```typescript
import fc from "fast-check";

it("should never return a negative duration", () => {
  fc.assert(
    fc.property(fc.date(), fc.date(), (start, end) => {
      const result = formatDuration(start, end);
      expect(result).not.toMatch(/^-/);
    })
  );
});
```

---

## Jest environment

The global default is `jsdom`. Server-side test files must declare the node environment — required because `crypto.randomUUID()` is not available in jsdom.

```typescript
/**
 * @jest-environment node
 */
```

| File location | Environment | Docblock required |
|---|---|---|
| `lib/**/*.test.ts` | node | Yes |
| `lib/actions/**/*.test.ts` | node | Yes |
| `lib/supabase/**/*.test.ts` | node | Yes |
| `components/**/*.test.tsx` | jsdom (default) | No |

---

## File size

- Maximum **150 lines** per test file including imports.
- At **120 lines**, split by behavior group: `events.validation.test.ts`, `events.persistence.test.ts`.
- Never combine tests for more than one source module in one file.

---

## Naming detail

- Test files mirror the source file with `.test.ts` / `.test.tsx`: `lib/events.ts` → `lib/events.test.ts`
- Split files use a dot-separated qualifier: `lib/events.createEvent.test.ts`
- Banned test case names: `test1`, `works`, `happy path`, `basic test`, `should work`

---

## Test isolation — cleanup patterns

**Supabase mocks** — rebuild in `beforeEach`, not shared across tests:

```typescript
describe("fetchEvent", () => {
  let mockSupabase: ReturnType<typeof buildMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = buildMockSupabaseClient();
    jest.clearAllMocks();
  });
});
```

**Environment variables** — always restore after override:

```typescript
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});
```

**Fake timers** — always restore after use:

```typescript
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
```

**Additional isolation rules:**
- Never rely on test execution order — Jest may shuffle or parallelize.
- Never share mutable state between `it()` blocks outside of `beforeEach` setup.

---

## Test data — available factories

All factories live in `lib/__tests__/factories.ts`. Use overrides to vary only what the test cares about. When the schema changes, update the factory — not every test.

| Factory | Use for |
|---|---|
| `makeBaseEvent(overrides?)` | Full event with host, timestamps, defaults |
| `makeRsvps({ going?, maybe?, declined? })` | Array of RSVP rows |
| `makeBaseProfile(overrides?)` | User profile |
| `makeBaseGroup(overrides?)` | Group with conversation |
| `makeBaseConversation(overrides?)` | Conversation stub |
| `makeBasePoll(overrides?)` | Poll |
| `makePollOption(overrides?)` | Poll option |

---

## Assertion rules

- Use Jest matchers: `toBe()`, `toEqual()`, `toMatchObject()`
- Async errors: `await expect(fn()).rejects.toThrow(...)`
- Never rely solely on `toHaveBeenCalled()` — also assert the return value, state change, or argument passed
- Components: prefer `screen.getByRole()` over `getByTestId()`
- Supabase calls: assert the **arguments** passed to `.from()`, `.eq()`, `.insert()` — not the internal call chain length

---

## Scripts

| Command | Description |
|---|---|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode (use while writing tests) |
