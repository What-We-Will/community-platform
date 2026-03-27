# M6-T03: Eliminate duplicate queries on dashboard

**Origin:** M6 (Dashboard Performance)
**Branch:** TBD
**Commit:** —
**Status:** Open

---

## Context

Several dashboard cards independently call `supabase.auth.getUser()` and re-fetch the user's profile, even though the dashboard page (`app/(app)/dashboard/page.tsx`) already fetches both. Each duplicate adds a Supabase round-trip for data already in scope.

**Milestone overview:** See `M6-overview.md` for the full query inventory.

**Why this matters:** These are easy wins — no architectural changes, just prop threading. Each eliminated query saves ~100-200ms of network round-trip.

## Duplicate queries identified

### 1. `AnnouncementsCard` — `components/dashboard/AnnouncementsCard.tsx`

**Lines 10-19:**
```typescript
const { data: { user } } = await supabase.auth.getUser();  // duplicate
const { data: announcements } = await supabase
  .from("announcements").select("id, content")...;
const { data: profile } = user
  ? await supabase.from("profiles").select("role").eq("id", user.id).single()  // duplicate
  : { data: null };
const isPlatformAdmin = profile?.role === "admin";
```

The dashboard page already calls `supabase.auth.getUser()` (line 21) and fetches the profile (line 26). `isPlatformAdmin` is already computed (line 30).

**Fix:** Pass `isPlatformAdmin` as a prop. Remove the `getUser()` and profile queries from the card.

```typescript
// Before
export async function AnnouncementsCard() {
// After
export async function AnnouncementsCard({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
```

Dashboard page change:
```typescript
// Before
<AnnouncementsCard />
// After
<AnnouncementsCard isPlatformAdmin={isPlatformAdmin} />
```

### 2. `UpcomingEventsCard` — `components/dashboard/UpcomingEventsCard.tsx`

**Lines 11-18:**
```typescript
const { data: { user } } = await supabase.auth.getUser();  // duplicate
const [events, viewerProfileResult] = await Promise.all([
  fetchUpcomingEvents({ groupId: null, limit: 5 }),
  user
    ? supabase.from("profiles").select("timezone").eq("id", user.id).single()  // duplicate
    : Promise.resolve({ data: null, error: null }),
]);
```

The dashboard page already has the user and profile (including timezone).

**Fix:** Pass `viewerTimezone` as a prop. Remove the `getUser()` and profile queries.

```typescript
// Before
export async function UpcomingEventsCard() {
// After
export async function UpcomingEventsCard({ viewerTimezone }: { viewerTimezone: string }) {
```

Dashboard page change:
```typescript
// Before
<UpcomingEventsCard />
// After
<UpcomingEventsCard viewerTimezone={profile?.timezone ?? "America/Chicago"} />
```

**Note:** `UpcomingEventsCard` still needs to call `fetchUpcomingEvents()` — that query is unique to this card and not a duplicate.

## Changes required

| File | Change |
|------|--------|
| `components/dashboard/AnnouncementsCard.tsx` | Accept `isPlatformAdmin` prop; remove `getUser()` and profile query |
| `components/dashboard/UpcomingEventsCard.tsx` | Accept `viewerTimezone` prop; remove `getUser()` and profile query |
| `app/(app)/dashboard/page.tsx` | Pass props to both cards |

## Expected improvement

| Metric | Before | After |
|--------|--------|-------|
| Duplicate `auth.getUser()` calls | 2 | 0 |
| Duplicate profile queries | 2 | 0 |
| Queries eliminated | 4 | — |

## Acceptance criteria

1. `AnnouncementsCard` and `UpcomingEventsCard` make zero `auth.getUser()` or profile queries
2. Admin controls still appear only for admins
3. Event times still display in the viewer's timezone
4. Cards still work when rendered outside the dashboard (if used elsewhere — verify no other call sites)
5. `npm run lint` and `npm run build` pass
