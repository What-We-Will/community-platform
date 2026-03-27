# M5 — State Bugs (Stale UI Investigation)

**Status:** Open
**Origin:** Anecdotal reports that some features/pages require manual refresh or navigate-away-and-back to see updates. Suspected pages: events, dashboard, messages.

---

## Problem statement

The codebase has a systemic mismatch between server-side data freshness and client-side state. Server Components fetch data once and pass it to Client Components, which copy it into `useState`. After mutations, `router.refresh()` or `revalidatePath()` re-renders the Server Component, but the Client Component's local state is **not** automatically reset — React preserves existing state for the same component instance. This causes the UI to show stale data until the user manually refreshes.

## Three root cause patterns

These patterns are referenced by ID (A, B, C) throughout all M5 task files.

**Pattern A — Optimistic state diverges from server.** Client Components update local state immediately on user action, then call a Server Action. Even if the Server Action succeeds and `revalidatePath()` fires, the Client Component's `useState` retains its optimistic value and ignores the fresh props from the re-rendered Server Component parent.

**Pattern B — Cross-page revalidation gaps.** A mutation on page X calls `revalidatePath("/pageX")` but doesn't revalidate page Y, which also displays the same data. Example: RSVP on `/events` revalidates `/events` but not `/dashboard`, which shows upcoming events with RSVP status.

**Pattern C — `router.refresh()` doesn't re-initialize client state.** This is a specific manifestation of Pattern A. There are 75+ `router.refresh()` calls in the codebase. Each one re-renders the Server Component tree but leaves `useState` untouched in Client Components.

## Project constraints (as of 2026-03-27)

These constraints inform decisions in T02 (logging), T04 (Playwright), and T05 (fix strategy):

| Constraint | Value | Impact |
|-----------|-------|--------|
| Active users | ~10 | Multi-user realtime sync is low priority; SWR/Query not justified yet |
| Testing environment | Local `npm run dev` + remote Supabase only | No staging/QA env; E2E tests must run locally |
| Tester count | 1 (platform lead) | Manual walkthrough must be structured and efficient; invest in automation |
| Existing test framework | Jest + Testing Library (unit) | Playwright would be new; no E2E exists yet |
| Existing logging | Ad-hoc `console.log`/`console.error` across ~19 files | No structured logger; need one before investigation |
| Deployment | Vercel (eventual) | Vercel logs will be available later; for now, terminal output only |

## Task dependency chain

```
T01 (code audit) ──────────┐
                            ├──→ T03 (manual walkthrough) ──→ T04 (Playwright) ──→ T05 (fixes)
T02 (structured logging) ──┘
```

- **T01 and T02 can run in parallel** — no dependencies between them
- **T03 depends on T02** — logging must be in place to correlate browser behavior with server output during manual testing
- **T03 uses T01's findings** — the audit tables in T01 tell you what to look for; T03 confirms whether each is a real bug
- **T04 depends on T03** — write E2E tests only for confirmed bugs, not theoretical ones
- **T05 depends on T03 + T04** — fix confirmed bugs, verify with E2E tests

## Tasks

| Task | File | Status | Description |
|------|------|--------|-------------|
| M5-T01 | `M5-T01-audit-revalidation-patterns.md` | Open | Code audit: catalog every component where client state can diverge from server |
| M5-T02 | `M5-T02-add-structured-logging.md` | Open | Add `lib/logger.ts` + instrument all Server Actions with mutation logging |
| M5-T03 | `M5-T03-manual-walkthrough-checklist.md` | Open | 24 manual test scenarios to confirm which bugs actually exist |
| M5-T04 | `M5-T04-playwright-setup-and-staleness-tests.md` | Open | Playwright setup + E2E staleness tests for confirmed bugs |
| M5-T05 | `M5-T05-fix-strategy-and-pros-cons.md` | Open | Evaluate fix approaches (pros/cons for each) and execute |

## Explicitly out of scope

- **Supabase Realtime subscription bugs** (e.g., messages from other users not appearing in real-time). This is a different class of problem — Realtime channel reliability, not stale React state. Candidate for a future milestone.
- **Multi-user concurrent edit conflicts** (e.g., two users editing the same group note). Related but distinct from single-user staleness. Defer until user count grows.

## Key decisions to make during execution

1. **T02:** ~~Pino vs. custom logger~~ — decided: custom logger for now (see T02 for rationale)
2. **T05:** SWR vs. TanStack Query vs. neither — recommendation is neither for now (see T05 for full comparison)
3. **T05:** Per-component fix strategy — default is Option 3 (derive from props); Option 2 (useEffect sync) only with documented justification
