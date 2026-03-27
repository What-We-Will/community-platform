# M6-T01: Batch conversation queries in fetchRecentConversations

**Origin:** M6 (Dashboard Performance)
**Branch:** TBD
**Commit:** —
**Status:** Open

---

## Context

`fetchRecentConversations()` in `lib/conversations.ts` is the single largest contributor to dashboard latency. It executes per-conversation queries for last messages and unread counts inside `Promise.all` loops, creating an N+1 pattern that scales with the number of conversations.

**Milestone overview:** See `M6-overview.md` for the full N+1 query map and observed timing data.

**Why this matters:** With 5 DMs and 3 groups, this function alone fires ~20 Supabase queries. Each query adds 50-200ms of network round-trip to a remote Supabase instance. This is the primary reason the dashboard takes 10-31 seconds to render.

## Current code (N+1 pattern)

### DM last messages — lines 73-86

```typescript
// Fires one query PER DM conversation
Promise.all(
  dmConvIds.map(async (cid) => {
    const { data } = await supabase
      .from("messages")
      .select("...")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { cid, msg: data };
  })
)
```

### DM unread counts — lines 87-101

```typescript
// Fires one query PER DM conversation
Promise.all(
  dmConvIds.map(async (cid) => {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", cid)
      .neq("sender_id", userId)
      .gt("created_at", participation.last_read_at);
    return { cid, count: count ?? 0 };
  })
)
```

The same pattern is duplicated for group conversations at lines 140-170.

## Fix strategy

### Last messages — replace N queries with 1

Supabase/PostgREST doesn't support `DISTINCT ON` directly, but we can fetch the most recent messages across all conversations in one query and deduplicate in JS:

```typescript
// ONE query for all conversation last messages
const { data: recentMessages } = await supabase
  .from("messages")
  .select("id, conversation_id, sender_id, content, message_type, metadata, edited_at, created_at")
  .in("conversation_id", allConvIds)
  .order("created_at", { ascending: false })
  .limit(allConvIds.length * 2); // overfetch slightly to ensure coverage

// Deduplicate: keep first (most recent) per conversation
const lastMsgMap = new Map<string, Message>();
for (const msg of recentMessages ?? []) {
  if (!lastMsgMap.has(msg.conversation_id)) {
    lastMsgMap.set(msg.conversation_id, msg as Message);
  }
}
```

**Alternative (if overfetch is a concern):** Use an RPC function with `DISTINCT ON (conversation_id)` for a single SQL round-trip with exact results. This is more efficient but adds a migration.

### Unread counts — replace N queries with 1 RPC

Per-conversation unread counts with different `last_read_at` thresholds can't be easily batched with the Supabase client. Two options:

**Option A — Single RPC function (recommended):**

```sql
CREATE OR REPLACE FUNCTION get_unread_counts(
  p_user_id UUID,
  p_conversation_ids UUID[]
)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT) AS $$
  SELECT m.conversation_id, COUNT(*)::BIGINT
  FROM messages m
  JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id
    AND cp.user_id = p_user_id
  WHERE m.conversation_id = ANY(p_conversation_ids)
    AND m.sender_id != p_user_id
    AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
  GROUP BY m.conversation_id
$$ LANGUAGE sql STABLE;
```

Call it once:

```typescript
const { data: unreads } = await supabase.rpc("get_unread_counts", {
  p_user_id: userId,
  p_conversation_ids: allConvIds,
});
```

**Option B — Fetch all recent messages and count in JS:**

```typescript
const { data: unreadMsgs } = await supabase
  .from("messages")
  .select("conversation_id, created_at")
  .in("conversation_id", allConvIds)
  .neq("sender_id", userId);

// Count per conversation against each participation's last_read_at
```

This overfetches data but avoids a migration. Acceptable at ~10 users.

## Changes required

| File | Change |
|------|--------|
| `lib/conversations.ts` | Replace both N+1 `Promise.all` loops (DM + group) with batched queries |
| `supabase/migrations/0XX_unread_counts_rpc.sql` | Add `get_unread_counts` RPC function (if Option A) |

## Expected improvement

| Metric | Before | After |
|--------|--------|-------|
| Queries (5 DMs + 3 groups) | ~20 | ~6-8 |
| Supabase round-trips saved | — | ~12-14 |
| Estimated time saved | — | 2-6 seconds (at ~200ms/round-trip) |

## Acceptance criteria

1. `fetchRecentConversations` makes no per-conversation queries — all loops replaced with batched operations
2. Dashboard `ActiveChatsCard` renders with identical data (same conversations, same unread counts, same sort order)
3. Messages page `ConversationList` (which also calls `fetchRecentConversations`) continues to work correctly
4. `npm run lint` and `npm run build` pass
