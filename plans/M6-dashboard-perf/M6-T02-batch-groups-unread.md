# M6-T02: Batch group unread count queries in MyGroupsCard

**Origin:** M6 (Dashboard Performance)
**Branch:** TBD
**Commit:** —
**Status:** Open

---

## Context

`MyGroupsCard` (`components/dashboard/MyGroupsCard.tsx`) executes a per-group-conversation unread count query inside a `Promise.all` loop at lines 72-85. This is the same N+1 pattern as `fetchRecentConversations` but scoped to group conversations only.

**Milestone overview:** See `M6-overview.md` for the full N+1 query map and observed timing data.

**Why this matters:** With 5 groups, this adds 5 extra Supabase round-trips (~1-2 seconds). Combined with T01's conversation queries, the dashboard is making 25+ queries per render.

## Current code (N+1 pattern)

### Lines 72-85 in `MyGroupsCard.tsx`

```typescript
const counts = await Promise.all(
  (participations ?? []).map(async (p) => {
    let query = supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", p.conversation_id)
      .neq("sender_id", userId);
    if (p.last_read_at) {
      query = query.gt("created_at", p.last_read_at);
    }
    const { count } = await query;
    return { conversation_id: p.conversation_id, count: count ?? 0 };
  })
);
```

## Fix strategy

### If T01 creates the `get_unread_counts` RPC — reuse it

If M6-T01 adds the `get_unread_counts` RPC function, `MyGroupsCard` can call the same function:

```typescript
const { data: unreads } = await supabase.rpc("get_unread_counts", {
  p_user_id: userId,
  p_conversation_ids: conversationIds,
});
const unreadByConvId: Record<string, number> = {};
for (const row of unreads ?? []) {
  unreadByConvId[row.conversation_id] = row.unread_count;
}
```

This replaces the entire `Promise.all` loop with a single query.

### If T01 uses the JS-side approach — apply the same pattern

Fetch all unread messages across all group conversations in one query and count in JS:

```typescript
// Single query: all messages newer than oldest last_read_at
const oldestReadAt = participations
  .map((p) => p.last_read_at)
  .filter(Boolean)
  .sort()[0];

const { data: msgs } = await supabase
  .from("messages")
  .select("conversation_id")
  .in("conversation_id", conversationIds)
  .neq("sender_id", userId)
  .gt("created_at", oldestReadAt ?? "1970-01-01");

// Count per conversation, filtering by each participation's last_read_at
const readAtMap = new Map(participations.map((p) => [p.conversation_id, p.last_read_at]));
const unreadByConvId: Record<string, number> = {};
for (const msg of msgs ?? []) {
  const readAt = readAtMap.get(msg.conversation_id);
  if (!readAt || msg.created_at > readAt) {
    unreadByConvId[msg.conversation_id] = (unreadByConvId[msg.conversation_id] ?? 0) + 1;
  }
}
```

## Changes required

| File | Change |
|------|--------|
| `components/dashboard/MyGroupsCard.tsx` | Replace `Promise.all` loop (lines 72-85) with batched query or RPC call |

## Expected improvement

| Metric | Before (5 groups) | After |
|--------|-------------------|-------|
| Queries | 3 base + 5 unread = 8 | 3 base + 1 unread = 4 |
| Supabase round-trips saved | — | 4 |

## Acceptance criteria

1. `MyGroupsCard` makes no per-conversation queries — the `Promise.all` loop is replaced
2. Unread counts display correctly (same numbers as before)
3. If T01 creates an RPC, this task reuses it rather than duplicating logic
4. `npm run lint` and `npm run build` pass
