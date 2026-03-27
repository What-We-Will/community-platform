# M6-T04: Measure improvement and evaluate further optimization

**Origin:** M6 (Dashboard Performance)
**Branch:** TBD
**Commit:** —
**Status:** Open

---

## Context

After T01, T02, and T03 are complete, this task measures the actual improvement and decides whether further optimization (SQL views, indexes, caching) is warranted.

**Milestone overview:** See `M6-overview.md` for baseline timing data.

**Depends on:** M6-T01, M6-T02, M6-T03

## Baseline (from `testing-logs.txt`, 2026-03-27)

| Request | Total | proxy.ts | render |
|---------|-------|----------|--------|
| `POST /dashboard` (worst) | 31.8s | 7.7s | 24.1s |
| `POST /dashboard` (median) | ~2.5s | ~0.8s | ~1.7s |
| `GET /dashboard` (first load) | 8.4s | 2.3s | 5.6s |

Estimated queries per dashboard render: **17-25**

## Measurement plan

### Step 1: Count queries (before/after)

Add temporary timing to the dashboard page to count Supabase round-trips:

```typescript
// In dashboard/page.tsx — temporary, remove after measurement
const t0 = performance.now();
// ... all rendering ...
console.log(`[dashboard] total render: ${Math.round(performance.now() - t0)}ms`);
```

Or simpler: count `[INFO] server-action` and proxy.ts entries in server logs during a dashboard load.

### Step 2: Load test

Run 5 dashboard loads (navigate away, navigate back) and record:

1. Total time from server logs (`GET /dashboard` or `POST /dashboard`)
2. proxy.ts time (Supabase query time)
3. render time (React SSR time)

### Step 3: Compare

| Metric | Before (T03 baseline) | After T01+T02+T03 | Target |
|--------|----------------------|-------------------|--------|
| Queries per render | 17-25 | ? | 8-10 |
| Worst-case total | 31.8s | ? | <5s |
| Median total | ~2.5s | ? | <1.5s |
| proxy.ts (worst) | 7.7s | ? | <2s |

### Step 4: Evaluate need for further optimization

**If total time < 3s consistently:** M6 is done. Ship it.

**If proxy.ts is still > 2s:** Consider:
- Adding database indexes on `messages(conversation_id, created_at)` and `messages(conversation_id, sender_id, created_at)`
- Check if these indexes already exist in the migrations

**If render time is still > 3s:** Consider:
- Profiling which dashboard cards are slowest to render
- Moving heavy cards to streaming with more granular `Suspense` boundaries
- Evaluating whether all cards need to render on initial load

**If still > 5s total:** Consider:
- A SQL view or materialized view for dashboard conversation summary
- Moving conversation data fetching to the page level (single batched query) and passing as props

## Deliverable

A comparison table (before/after) committed to this file, with a recommendation on whether M6 is complete or needs further work.

## Acceptance criteria

1. Before/after timing data collected and documented
2. Clear recommendation: ship as-is, or define follow-up tasks
3. Temporary measurement code removed before merge
