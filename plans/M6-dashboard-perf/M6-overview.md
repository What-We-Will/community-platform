# M6 — Dashboard Performance

**Status:** Open
**Origin:** M5-T03 manual walkthrough — server logs revealed dashboard renders taking 10-31 seconds. Root cause: N+1 Supabase queries in `fetchRecentConversations` and `MyGroupsCard`, plus a duplicate profile query in `AnnouncementsCard`.

---

## Problem statement

The dashboard Server Component makes **17-25 Supabase round-trips** per render. Each round-trip goes to a remote Supabase instance, adding network latency on top of query time. Two components account for the majority of the problem:

1. **`fetchRecentConversations()`** (`lib/conversations.ts`) — executes per-conversation queries for last messages and unread counts inside `Promise.all` loops. With N conversations, this fires 2N extra queries (N for last messages + N for unread counts), duplicated for both DM and group conversations.

2. **`MyGroupsCard`** (`components/dashboard/MyGroupsCard.tsx`) — same pattern: per-group-conversation unread count queries inside a `Promise.all` loop.

3. **`AnnouncementsCard`** — re-fetches the user's profile to check admin role, even though the dashboard page already fetched it.

### Observed impact (from `testing-logs.txt`, 2026-03-27)

| Request | Total time | proxy.ts (Supabase) | render (React SSR) |
|---------|-----------|--------------------|--------------------|
| `POST /dashboard` | **31.8s** | 7.7s | 24.1s |
| `POST /dashboard` | **21.1s** | 4.5s | 16.6s |
| `POST /messages` | **34.1s** | 10.4s | 23.7s |
| `GET /groups` | **33.0s** | 27.1s | 5.5s |

The dashboard is the most-visited page. Every `router.refresh()` from any mutation re-renders it, and paired POST requests (action + refresh) double the load.

## N+1 query map

### `fetchRecentConversations()` — `lib/conversations.ts`

```
Query 1: conversation_participants (get user's conversations)
Query 2: conversations (get conversation metadata)
Query 3: conversation_participants (get other participants for DMs)
Query 4: profiles (get participant profiles)
─── N+1 ZONE (DMs) ───
Query 5..5+N: messages per DM conversation (last message)     ← lines 74-85
Query 6..6+N: messages per DM conversation (unread count)     ← lines 88-100
─── N+1 ZONE (Groups) ───
Query 7: groups (get group metadata)
Query 8..8+N: messages per group conversation (last message)  ← lines 142-153
Query 9..9+N: messages per group conversation (unread count)  ← lines 156-168
```

**With 5 DMs + 3 groups: 4 base + 10 DM + 6 group = 20 queries**

### `MyGroupsCard` — `components/dashboard/MyGroupsCard.tsx`

```
Query 1: group_members (get user's groups with nested group data)
Query 2: group_members (count members per group — batch with .in())
Query 3: conversation_participants (get last_read_at per conversation)
─── N+1 ZONE ───
Query 4..4+N: messages per conversation (unread count)        ← lines 72-85
```

**With 5 groups: 3 base + 5 unread = 8 queries**

### `AnnouncementsCard` — `components/dashboard/AnnouncementsCard.tsx`

```
Query 1: auth.getUser()                    ← duplicate (dashboard already called this)
Query 2: announcements
Query 3: profiles (check admin role)       ← duplicate (dashboard already fetched profile)
```

**3 queries, 2 are duplicates**

## Project constraints

| Constraint | Value | Impact on M6 |
|-----------|-------|--------------|
| Database | Remote Supabase (not local) | Every query has network latency; reducing query count has outsized impact |
| Users | ~10 active | Low concurrency, but single-user latency is the problem |
| Conversations per user | ~5-10 | N+1 multiplier is modest but still adds 10-20 unnecessary queries |
| Dashboard renders per session | High (every `router.refresh()`) | Optimization pays off on every user action |

## Tasks

| Task | File | Status | Description |
|------|------|--------|-------------|
| M6-T01 | `M6-T01-batch-conversation-queries.md` | Open | Replace N+1 loops in `fetchRecentConversations` with batched `.in()` queries |
| M6-T02 | `M6-T02-batch-groups-unread.md` | Open | Replace N+1 unread loop in `MyGroupsCard` with single batched query |
| M6-T03 | `M6-T03-eliminate-duplicate-queries.md` | Open | Pass `isPlatformAdmin` and `user` to `AnnouncementsCard` and `UpcomingEventsCard` as props |
| M6-T04 | `M6-T04-measure-and-evaluate.md` | Open | Before/after timing comparison; evaluate if a SQL view is warranted |

## Priority and expected impact

| Priority | Task | Queries eliminated | Est. time saved | Effort | Why this order |
|----------|------|-------------------|----------------|--------|----------------|
| 1 | **T01** — Batch conversation queries | 12-14 (of ~20) | 2-6s | Medium | Largest single contributor to latency. Fixes both dashboard and messages page. |
| 2 | **T03** — Eliminate duplicate queries | 4 | 0.5-1s | Trivial | Prop threading only — no logic changes, no migrations. Ship with T01. |
| 3 | **T02** — Batch groups unread | 4 | 0.5-1s | Small | Reuses T01's approach (or RPC). Straightforward once T01 pattern is established. |
| 4 | **T04** — Measure and evaluate | — | — | Small | Validates whether T01-T03 are sufficient or if indexes/views are needed. |

**Combined expected impact:** Reduce dashboard from ~25 queries to ~8, cutting worst-case render from 31s to an estimated 3-8s. The remaining queries are inherently parallel (Suspense boundaries) and hit different tables.

## Task dependency chain

```
T01 (batch conversations) ──┐
T02 (batch groups unread) ──┼──→ T04 (measure improvement)
T03 (eliminate duplicates) ──┘
```

T01, T02, and T03 are independent and can be worked in parallel or in any order. T04 runs after all three to measure the combined improvement.

## Out of scope

- **Client-side caching (SWR/TanStack Query)** — not justified at ~10 users. Revisit if user count grows.
- **Supabase Realtime for dashboard** — would add complexity for marginal benefit at current scale.
- **Database-level optimizations (materialized views, indexes)** — evaluate in T04 only if query batching doesn't reduce latency enough.
- **`GET /groups` 33s load** — separate page, different query patterns. Candidate for M7 if needed.
