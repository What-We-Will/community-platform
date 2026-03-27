# M5-T03: Manual walkthrough checklist — confirm state bugs

**Origin:** M5 (State Bugs)
**Branch:** TBD
**Commit:** —
**Status:** Open

---

## Context

Since there's no E2E test suite yet and only one tester (platform lead), this task provides a structured manual checklist to systematically confirm which state bugs actually exist. Run this after M5-T02 (logging) is in place so you can correlate browser behavior with server logs.

**Milestone overview:** See `M5-overview.md` for full problem statement, constraints, and dependency chain.

**Depends on:** M5-T02 (structured logging must be in place before running this walkthrough).
**Feeds into:** M5-T01 (fill in the "Confirmed stale?" column), M5-T04 (write E2E tests for confirmed bugs only).

## Setup

1. Run `npm run dev` with terminal visible (to see server logs)
2. Open browser DevTools → Console (to see client logs)
3. Open the app in **two browser tabs** (same user) to test same-user staleness
4. Optionally: open a **private/incognito window** logged in as a second user to test multi-user scenarios
5. For each test case: record Pass/Fail and any log output anomalies

## Key diagnostic — read this before starting

For each failure, determine which fix it needs by testing two things: (1) does a manual browser refresh fix it? (2) does navigating away then back fix it?

- If **refresh fixes it** → server data is correct, client state is stale. Root cause: **Pattern A** (optimistic `useState` diverges from server props — the Client Component updated local state but ignored fresh props from the re-rendered Server Component parent) or **Pattern C** (`router.refresh()` re-renders the server tree but `useState` in Client Components retains old value).
- If **navigate away/back fixes it** → `revalidatePath` is correct but Next.js router cache is serving a stale RSC payload. Root cause: **Pattern B** (cross-page revalidation gap — the mutation revalidated its own page but not other pages that display the same data).
- If **neither fixes it** → data isn't being saved correctly (server bug, not a state bug).

## Test cases

### Events page (`/events`)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| E1 | RSVP updates count immediately | Click "Going" on an event | Count increments, button state changes | Pass |
| E2 | RSVP persists after navigate away/back | RSVP → go to Dashboard → return to Events | RSVP status and count still reflect your action | Pass |
| E3 | Create event appears in list | Create a new event → navigate to /events | New event appears without refresh | Pass |
| E4 | Create event appears on dashboard | Create event → go to /dashboard | Event shows in "Upcoming Events" card | Pass |
| E5 | Edit event reflects immediately | Edit event title → save → view event list | Updated title shows without refresh | Pass |
| E6 | Cancel/delete event removes from list | Cancel event → navigate to /events | Event no longer appears | Pass |

### Dashboard (`/dashboard`)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| D1 | Dashboard reflects RSVP from events page | RSVP on /events → navigate to /dashboard | Upcoming Events card shows your RSVP | **Needs product decision.** Unclear behavior: should an event appear in Upcoming Events if the user RSVPs "Not Going"? And should it appear if no RSVP is set at all? Not a state bug — requires product clarity on what the card should display. |
| D2 | New message shows in Recent Chats | Send a message on /messages → go to /dashboard | Recent Chats card shows recent message | **Pass.** Note: self-chat returns "Could not open conversation" error — expected behavior, not a bug. |
| D3 | Poll vote reflects immediately | Vote on a poll → check results | Results update without refresh | Pass |
| D4 | Announcement changes appear | (Admin) Create announcement → view dashboard as user | Announcement visible without refresh | **Pass (UX note).** Data arrives correctly without manual refresh, but there's a 1-2s gap after save where the editor dismisses and the row hasn't appeared yet — `router.refresh()` latency, not a state bug. Fix would be optimistic UI (out of scope for M5). |
| D5 | Schedule changes appear | (Admin) Update schedule → view dashboard | Schedule reflects changes | **FAIL — Pattern A.** `WeeklyScheduleAdmin` copies `initialRows` into `useState` on mount (line 31). `router.refresh()` delivers fresh props but `useState` ignores them. Collapse/expand "fixes" it because unmount→remount re-initializes state with fresh props. **Also:** zoom_url field accepts any string (no URL validation — separate bug, not a state bug). |

### Messages (`/messages`)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| M1 | Sent message appears in thread | Send a message in a conversation | Message appears immediately in the thread | Pass |
| M2 | Unread indicator updates | Receive message → navigate to /messages list | Unread badge/indicator shows on the conversation | Pass |
| M3 | Read status clears | Open unread conversation → go back to list | Unread indicator gone | Pass |
| M4 | Conversation list order updates | Receive new message → check /messages list | Conversation moves to top of list | **Pass.** |
| M5 | Auto-read marks messages user hasn't seen | Have conversation open, tab away, receive new messages, tab back | New messages should show as unread until user scrolls/focuses | **UX issue.** Incoming messages in the active conversation are auto-marked as read even if the user is tabbed away. User could miss new messages. Not a state bug — needs visibility-based read receipts (out of scope for M5). |

| M6 | React error: setState during render in ConversationList | Open a conversation → receive a message for an unknown conversation | Console error: "Cannot update Router while rendering ConversationList" | **BUG (React anti-pattern).** `router.refresh()` is called inside the `setConversations` updater at `ConversationList.tsx:99`. When a Realtime INSERT arrives for a conversation not in the list (`idx === -1`), it triggers a Router state update during the conversations state update. Fix: move the `router.refresh()` call outside the updater. Not a staleness bug — a correctness bug. |

> **Out of scope for M5:** Realtime message receipt from other users (Supabase Realtime subscription behavior). That's a different class of problem — tracked as a future milestone candidate in `M5-overview.md`.

### Groups (`/groups/[slug]`)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| G1 | Group name change reflects | Edit group name → save | New name shows in header without refresh | **Pass (UX note).** Name updates without manual refresh, but there is noticeable delay due to `router.refresh()` latency. Same pattern as D4 and L1c — no optimistic UI. |
| G2 | Group description change reflects | Edit description → save | Updated description visible | Pass |
| G3 | Add note appears | Create a new group note | Note appears in list immediately | **FAIL — Pattern A/C.** `GroupHubClient` stores notes in `useState(initialNotes)` (line 79). `handleAddNote` (line 209) clears the form and calls `router.refresh()` but does NOT optimistically insert into local `notes` state. The refresh delivers fresh props but `useState` ignores them — same root cause as D5. Note: edit (G4) and delete (G5) pass because they DO update local state optimistically. |
| G4 | Edit note reflects | Edit a note → save | Content updates without refresh | Pass |
| G5 | Delete note removes from list | Delete a note | Note disappears without refresh | Pass |
| G6 | Group chat message appears | Send a message in group chat | Message visible immediately | Pass |
| G7 | Create group dialog label is confusing | Open create group → toggle "Private Group" on/off | Label should reflect current state | **UX issue.** Label always says "Private Group" regardless of toggle state. Helper text updates correctly ("Anyone can find and join" vs "Members must be invited or approved") but the label doesn't flip. Not a state bug — misleading copy. |
| G8 | "Save URL" button looks disabled | Go to group settings → change the URL slug | Button should visually activate when input changes | **UX issue.** "Save URL" button stays grey/muted after editing, unlike "Save name & description" which turns black. Gives the impression it's disabled. Button style should reflect dirty state. Not a state bug. |
| G9 | Hydration mismatch in group tabs | Navigate to a group page | No console errors | **BUG (hydration).** Server-rendered HTML doesn't match client in `TabsTrigger` (`components/ui/tabs.tsx:64`), triggered via `GroupHubClient.tsx:307`. Likely SSR/client branch or dynamic content in tabs. Not a state bug. |
| G10 | Nested button inside button | View group members list | No console errors | **BUG (invalid HTML).** `<button>` nested inside `<button>` at `GroupHubClient.tsx:548` (inside a `.map` at line 522). Causes hydration error and is invalid HTML. Likely a `Button` component inside a clickable parent element. Not a state bug. |

### Profile (`/profile`)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| P1 | Profile update saves and reflects | Edit bio → save | Updated bio shows without refresh | Pass |
| P2 | Timezone change affects event display | Change timezone in profile → navigate to /events | Event times display in new timezone | Pass |
| P3 | Avatar change reflects in nav | Update avatar → check sidebar/nav | New avatar shows without page refresh | **FAIL (infra).** "Bucket not found" — the `avatars` storage bucket doesn't exist (or isn't public) on the Supabase project. Need to create it in Supabase dashboard → Storage → New bucket → "avatars" (public). Not a state bug — missing storage config. Cannot test nav reflection until bucket exists. |

### Learning & Tracker (`/learning`, `/tracker`)

| # | Scenario | Steps | Expected | Pass/Fail |
|---|----------|-------|----------|-----------|
| L1 | Add learning resource appears | Add a new resource | Appears in list without refresh | Pass |
| L1c | Star/featured toggle has no immediate feedback | Click the star on a learning path | Star should toggle immediately | **UX issue.** No optimistic UI — star doesn't change until `router.refresh()` completes and the whole card turns yellow. Delay is large enough that users could click multiple times, toggling on-off. Needs optimistic state toggle with debounce or disable-while-pending. Not a state bug. |
| L1b | Learning path URL validation too strict | Add a new learning path item with URL "www.google.com" | Should accept or auto-prefix https:// | **UX issue.** Validation rejects URLs without `https://` prefix. Other parts of the app (e.g. `links/actions.ts`) auto-prefix — learning paths should do the same. Not a state bug. |
| L2 | Learning tracker drag-drop persists | On `/learning` personal tracker tab, drag an item to a different status column (uses dnd-kit) | Position persists after navigate away/back | Pass |
| L3 | Delete resource removes | Delete a resource → check list | Gone without refresh | **Pass (UX note).** Resource disappears without refresh, but same `router.refresh()` delay as L1c — item lingers visibly before removal. No optimistic removal. |

### Server log analysis (`testing-logs.txt`)

107 server actions logged during the session. **Zero errors** — all actions completed successfully. The data layer is solid. However, the logs revealed significant performance and duplication issues:

| # | Finding | Detail |
|---|---------|--------|
| SL1 | Dashboard render times spike to 10-31s | `POST /dashboard` hit 31.8s (render: 24.1s, proxy: 7.7s). Dashboard aggregates events, messages, polls, announcements, and schedule — likely N+1 queries or too many sequential Supabase calls. |
| SL2 | Groups page query bottleneck | `GET /groups` hit 33.0s, with 27.1s in proxy.ts (Supabase round-trip). Suggests missing indexes or overly broad selects. |
| SL3 | Messages page extreme latency | `POST /messages` hit 34.1s (proxy: 10.4s, render: 23.7s). Worst single request observed. |
| SL4 | Events page render bottleneck | `POST /events` hit 15.9s (render: 13.1s). Event create hit 10s in render alone. |
| SL5 | Duplicate POST requests from `router.refresh()` | Server logs show paired POST requests within milliseconds (e.g., action POST + refresh POST). Each user action triggers two server round-trips, doubling server-side work. |
| SL6 | RSVP action spam — 50 calls in one session | No disable-while-pending on RSVP button allowed 50 `updateRsvp` calls. Also 8 `toggleStarPath` calls confirming L1c (star toggle has no debounce). |
| SL7 | 21-second dashboard load confirmed server-side | The 21s latency reported during testing is NOT a local machine issue — logs show render: 16.6s + proxy: 4.5s. This is real server-side latency. |

## How to record results

For each failure:
1. Note the exact steps to reproduce
2. Copy the server log output from terminal (look for the `server-action:complete` logs and what `revalidated` paths were included)
3. Note whether a manual browser refresh fixes it
4. Note whether navigate-away-then-back fixes it (this distinguishes "missing revalidatePath" from "client state not syncing")

Refer to the **Key diagnostic** section at the top of this file to classify each failure.

## Summary of findings

### Confirmed state bugs (M5 scope)

| ID | Component | Pattern | Description |
|----|-----------|---------|-------------|
| D5 | `WeeklyScheduleAdmin` | **A** | `useState(initialRows)` ignores fresh props after `router.refresh()`. Collapse/expand remounts and "fixes" it. |
| G3 | Group notes (in `GroupHubClient`) | **A or C** | New note doesn't appear until refresh. Needs further investigation — `GroupHubClient` was already flagged in T01 as the heaviest Pattern A offender (7 prop→state vars, 11 `router.refresh()` calls). |

### React correctness bugs (not state staleness, but should fix)

| ID | Component | Description |
|----|-----------|-------------|
| M6 | `ConversationList` | `router.refresh()` called inside `setConversations` updater (line 99) — triggers setState on Router during render. |
| G9 | `GroupHubClient` / `tabs.tsx` | Hydration mismatch — server HTML doesn't match client in TabsTrigger. |
| G10 | `GroupHubClient` | Nested `<button>` inside `<button>` at line 548 — invalid HTML, causes hydration error. |

### Infrastructure blockers

| ID | Area | Description |
|----|------|-------------|
| P3 | Avatar upload | `avatars` storage bucket doesn't exist on Supabase project. Cannot test avatar state behavior until created. |

### UX issues (not state bugs — separate backlog)

| ID | Area | Description |
|----|------|-------------|
| D1 | Dashboard RSVP | Unclear whether "Not Going" or no RSVP should show in Upcoming Events card. Needs product decision. |
| G1 | Group name | Save works but noticeable delay — `router.refresh()` latency, no optimistic UI. |
| D4 | Announcements | 1-2s gap after save where editor dismisses but new row hasn't appeared — `router.refresh()` latency. |
| G7 | Create group dialog | "Private Group" label doesn't change when toggle flips. Helper text updates but label is static. |
| G8 | Group settings | "Save URL" button stays grey after editing — looks disabled. |
| M5 | Messages | Auto-marks messages as read even when user is tabbed away. Needs `document.visibilityState` check. |
| L1b | Learning paths | URL validation rejects `www.` without `https://` prefix. Should auto-prefix like `links/actions.ts`. |
| L1c | Learning paths | Star/featured toggle has no optimistic feedback. Users can click multiple times before action completes. |
| L3 | Learning resources | Delete works but item lingers due to `router.refresh()` delay. No optimistic removal. |
| D5 (secondary) | Schedule | zoom_url field accepts any string — no URL validation. |

### Performance issues (from server log analysis)

| ID | Area | Worst observed | Bottleneck | Description |
|----|------|---------------|------------|-------------|
| PERF-1 | `/dashboard` | **31.8s** (render: 24.1s, proxy: 7.7s) | Server render + Supabase queries | Dashboard aggregates events, messages, polls, announcements, and schedule. Render times spike to 9-24s. Likely N+1 queries or too many parallel Supabase calls. POST requests come in pairs (action + `router.refresh()` re-fetch), doubling server load. |
| PERF-2 | `/groups` | **33.0s** (proxy: 27.1s, render: 5.5s) | Supabase queries | Groups page initial load dominated by proxy.ts (Supabase round-trip). 27s in queries alone suggests missing indexes or overly broad selects. |
| PERF-3 | `/messages` | **34.1s** (proxy: 10.4s, render: 23.7s) | Both | Messages page hit 34s on a POST (likely `router.refresh()` after an action). Render time of 23.7s is extreme. |
| PERF-4 | `/events` | **15.9s** (proxy: 2.8s, render: 13.1s) | Server render | Events page render hit 13s. Event create POST hit 10s in render alone. |
| PERF-5 | Duplicate requests | N/A | `router.refresh()` | Server logs show paired POST requests within milliseconds (e.g., lines 35-36, 37-38). Each action fires a server action POST *and* a refresh POST, effectively doubling server-side work. |
| PERF-6 | RSVP spam | 50 calls in session | No debounce | 50 `updateRsvp` calls logged in a single test session. No disable-while-pending allows rapid duplicate submissions. Also 8 `toggleStarPath` calls confirming L1c. |

### Pass (no issues)

E1, E2, E3, E4, E5, E6, D2, D3, G2, G4, G5, G6, L1, L2, M1, M2, M3, M4, P1, P2

### Scorecard

- **24 original test cases** + **16 discovered issues** = **40 total findings**
- **Pass:** 20
- **State bugs (M5 scope):** 2 confirmed (D5, G3)
- **React bugs:** 3 (M6, G9, G10)
- **Performance issues:** 6 (PERF-1 through PERF-6)
- **Infra blocker:** 1 (P3)
- **UX issues:** 10 (backlog candidates)

### Recommended next steps

**Immediate (M5 scope):**
1. **Fix D5 and G3** via T05 fix strategy — both are Pattern A, fix by deriving from props or adding `useEffect` sync.
2. **Fix M6** — quick win, move `router.refresh()` outside the state updater.
3. **Fix G9/G10** — HTML nesting and hydration bugs in `GroupHubClient`.

**Short-term:**
4. **Create P3 storage bucket** to unblock avatar testing.
5. **Add debounce/disable-while-pending** to RSVP button and star toggle (PERF-6, L1c) — prevents duplicate server action spam.
6. **File UX issues** as separate GitHub issues for backlog prioritization.

**Investigate (new milestone candidate):**
7. **Dashboard performance audit** (PERF-1) — render times hitting 24s suggests the dashboard Server Component is making too many sequential Supabase queries. Profile the queries, consider parallel fetching, and evaluate whether all data needs to load on initial render.
8. **Groups page query optimization** (PERF-2) — 27s in proxy.ts points to missing indexes or overly broad selects.
9. **Evaluate `router.refresh()` duplication** (PERF-5) — paired POST requests double server load on every action. Consider whether optimistic UI can eliminate some refresh calls entirely.
