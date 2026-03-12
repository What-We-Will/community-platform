jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { fetchEventWithDetails } from "./events";

// ── helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date("2026-03-11T15:00:00.000Z");

function makeBaseEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    title: "Test Event",
    description: null,
    event_type: "workshop",
    host_id: "host-user",
    group_id: null,
    location: "Online",
    video_room_name: "whatwewill-event-event-1",
    starts_at: "2026-03-11T14:00:00.000Z",
    ends_at: "2026-03-11T16:00:00.000Z",
    max_attendees: null,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    host: { id: "host-user", display_name: "Host" },
    group: null,
    ...overrides,
  };
}

type RsvpRow = { status: string; user_id: string; event_id: string };

function makeRsvps(counts: { going?: number; maybe?: number; declined?: number }): RsvpRow[] {
  const rows: RsvpRow[] = [];
  for (let i = 0; i < (counts.going ?? 0); i++) {
    rows.push({ status: "going", user_id: `u${i}`, event_id: "event-1" });
  }
  for (let i = 0; i < (counts.maybe ?? 0); i++) {
    rows.push({ status: "maybe", user_id: `m${i}`, event_id: "event-1" });
  }
  for (let i = 0; i < (counts.declined ?? 0); i++) {
    rows.push({ status: "declined", user_id: `d${i}`, event_id: "event-1" });
  }
  return rows;
}

// Simpler mock approach: build per-call interceptors
function buildClientWithSequentialRsvps(
  eventData: Record<string, unknown> | null,
  allRsvps: RsvpRow[],
  userRsvp: RsvpRow | null = null,
  eventError: { message: string } | null = null
) {
  let callIndex = 0;

  const mockClient = {
    from: jest.fn((table: string) => {
      if (table === "events") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: eventData,
            error: eventError,
          }),
        };
      }
      // table === "event_rsvps" — two calls:
      //   call 0: select(*).eq(event_id) → { data: allRsvps }
      //   call 1: select(*).eq(event_id).eq(user_id).maybeSingle() → { data: userRsvp }
      callIndex++;
      if (callIndex === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: allRsvps, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: userRsvp,
          error: null,
        }),
      };
    }),
  };
  return mockClient;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

// ── fetchEventWithDetails ─────────────────────────────────────────────────────

describe("fetchEventWithDetails", () => {
  // ── null / error paths ────────────────────────────────────────────────────

  it("returns null when the event does not exist (error from Supabase)", async () => {
    const mock = buildClientWithSequentialRsvps(
      null, [], null, { message: "Not found" }
    );
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("nonexistent", "user-1");
    expect(result).toBeNull();
  });

  it("returns null when event data is null (no error but no row)", async () => {
    const mock = buildClientWithSequentialRsvps(null, []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result).toBeNull();
  });

  // ── rsvpCounts ────────────────────────────────────────────────────────────

  it("counts rsvps correctly with all three statuses present", async () => {
    const rsvps = makeRsvps({ going: 3, maybe: 2, declined: 1 });
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), rsvps, null);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts).toEqual({ going: 3, maybe: 2, declined: 1 });
  });

  it("returns zero counts when there are no rsvps", async () => {
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts).toEqual({ going: 0, maybe: 0, declined: 0 });
  });

  it("counts only 'going' rsvps correctly", async () => {
    const rsvps = makeRsvps({ going: 5 });
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), rsvps);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts.going).toBe(5);
    expect(result?.rsvpCounts.maybe).toBe(0);
    expect(result?.rsvpCounts.declined).toBe(0);
  });

  it("ignores unknown rsvp statuses in counts", async () => {
    const rsvps = [
      { status: "going", user_id: "u1", event_id: "event-1" },
      { status: "unknown_status", user_id: "u2", event_id: "event-1" },
    ] as RsvpRow[];
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), rsvps);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts).toEqual({ going: 1, maybe: 0, declined: 0 });
  });

  // ── isLive ────────────────────────────────────────────────────────────────

  it("isLive is true when NOW is between starts_at and ends_at", async () => {
    // NOW = 2026-03-11T15:00Z, event = 14:00–16:00 UTC
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(true);
  });

  it("isLive is false when NOW is before starts_at", async () => {
    const event = makeBaseEvent({
      starts_at: "2026-03-11T16:00:00.000Z",
      ends_at: "2026-03-11T17:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(false);
  });

  it("isLive is false when NOW is after ends_at", async () => {
    const event = makeBaseEvent({
      starts_at: "2026-03-11T12:00:00.000Z",
      ends_at: "2026-03-11T14:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(false);
  });

  it("isLive is true when NOW equals starts_at (boundary)", async () => {
    const event = makeBaseEvent({
      starts_at: NOW.toISOString(),
      ends_at: "2026-03-11T16:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(true);
  });

  // ── isPast ────────────────────────────────────────────────────────────────

  it("isPast is true when ends_at is before NOW", async () => {
    const event = makeBaseEvent({
      starts_at: "2026-03-11T12:00:00.000Z",
      ends_at: "2026-03-11T14:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isPast).toBe(true);
  });

  it("isPast is false when ends_at is after NOW", async () => {
    // Event ends 16:00, NOW is 15:00
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isPast).toBe(false);
  });

  it("isPast is false when event is currently live", async () => {
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    // isLive and isPast are mutually exclusive when live
    expect(result?.isLive).toBe(true);
    expect(result?.isPast).toBe(false);
  });

  // ── currentUserRsvp ───────────────────────────────────────────────────────

  it("returns the user's rsvp when found", async () => {
    const userRsvp = { status: "going", user_id: "user-1", event_id: "event-1" };
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), makeRsvps({ going: 1 }), userRsvp);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.currentUserRsvp).toEqual(userRsvp);
  });

  it("returns null for currentUserRsvp when user has not RSVPed", async () => {
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), [], null);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.currentUserRsvp).toBeNull();
  });

  // ── field pass-through ────────────────────────────────────────────────────

  it("includes all base event fields in the returned object", async () => {
    const event = makeBaseEvent({ title: "My Event", location: "Room 101" });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.title).toBe("My Event");
    expect(result?.location).toBe("Room 101");
    expect(result?.id).toBe("event-1");
  });
});
