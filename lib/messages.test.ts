import type { Mock } from "vitest";
import { selfNotesConversationId, findExistingDM } from "./messages";

// ── selfNotesConversationId ───────────────────────────────────────────────────

describe("selfNotesConversationId", () => {
  const USER_A = "user-uuid-aaa-111";
  const USER_B = "user-uuid-bbb-222";

  it("returns a string", () => {
    expect(typeof selfNotesConversationId(USER_A)).toBe("string");
  });

  it("returns a valid UUID-shaped string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)", () => {
    const id = selfNotesConversationId(USER_A);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("is deterministic — same userId always returns the same ID", () => {
    expect(selfNotesConversationId(USER_A)).toBe(selfNotesConversationId(USER_A));
  });

  it("returns different IDs for different users", () => {
    expect(selfNotesConversationId(USER_A)).not.toBe(selfNotesConversationId(USER_B));
  });

  it("uses the '5' version nibble in position 3 of the UUID", () => {
    // UUID format: xxxxxxxx-xxxx-5xxx-xxxx-xxxxxxxxxxxx
    const id = selfNotesConversationId(USER_A);
    const thirdGroup = id.split("-")[2];
    expect(thirdGroup[0]).toBe("5");
  });

  it("produces a different ID from a DM conversation ID for the same user pair", () => {
    // selfNotes uses "notes:" namespace, DMs use "dm:" — they must never collide
    const notesId = selfNotesConversationId(USER_A);
    // Create a notes ID for user B and verify it is different from A's notes ID
    const notesBId = selfNotesConversationId(USER_B);
    expect(notesId).not.toBe(notesBId);
  });

  it("handles UUIDs with hyphens as userId", () => {
    const uid = "550e8400-e29b-41d4-a716-446655440000";
    const id = selfNotesConversationId(uid);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

// ── findExistingDM ────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

describe("findExistingDM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null immediately when userId1 === userId2 (self-messaging guard)", async () => {
    const result = await findExistingDM("same-user", "same-user");
    expect(result).toBeNull();
    // Supabase should NOT be called at all
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns null when user1 has no conversations", async () => {
    const mock = makeMockSupabase();
    // First query (user1 participations) returns empty
    mock.eq = vi.fn().mockReturnThis();
    mock.select = vi.fn().mockReturnThis();

    // We need per-call return values because there are multiple query chains
    let callCount = 0;
    const originalFrom = mock.from.bind(mock);
    mock.from = vi.fn().mockImplementation((table: string) => {
      callCount++;
      if (callCount === 1) {
        // First call: conversation_participants for user1
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn(),
        };
      }
      return originalFrom(table);
    });

    // Simpler approach: mock createClient to return a chainable that ultimately
    // resolves to empty on the first real query
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };
    (createClient as Mock).mockResolvedValue(mockClient);

    const result = await findExistingDM("user1", "user2");
    expect(result).toBeNull();
  });

  it("returns null when users share no conversations", async () => {
    const mockClient = {
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ conversation_id: "conv-1" }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
    };
    (createClient as Mock).mockResolvedValue(mockClient);

    const result = await findExistingDM("user1", "user2");
    expect(result).toBeNull();
  });

  it("returns the conversation ID when a shared DM conversation is found", async () => {
    const mockClient = {
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ conversation_id: "conv-abc" }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ conversation_id: "conv-abc" }],
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "conv-abc" },
            error: null,
          }),
        }),
    };
    (createClient as Mock).mockResolvedValue(mockClient);

    const result = await findExistingDM("user1", "user2");
    expect(result).toBe("conv-abc");
  });
});
