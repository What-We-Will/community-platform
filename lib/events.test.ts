vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import type { Mock } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { fetchEventWithDetails, upsertGoogleCalendarEvent } from "./events";

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

// Build per-call interceptors
function buildClientWithSequentialRsvps(
  eventData: Record<string, unknown> | null,
  allRsvps: RsvpRow[],
  userRsvp: RsvpRow | null = null,
  eventError: { message: string } | null = null
) {
  let callIndex = 0;

  const mockClient = {
    from: vi.fn((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
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
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: allRsvps, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: userRsvp,
          error: null,
        }),
      };
    }),
  };
  return mockClient;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── fetchEventWithDetails ─────────────────────────────────────────────────────

describe("fetchEventWithDetails", () => {
  // ── null / error paths ────────────────────────────────────────────────────

  it("returns null when the event does not exist (error from Supabase)", async () => {
    const mock = buildClientWithSequentialRsvps(
      null, [], null, { message: "Not found" }
    );
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("nonexistent", "user-1");
    expect(result).toBeNull();
  });

  it("returns null when event data is null (no error but no row)", async () => {
    const mock = buildClientWithSequentialRsvps(null, []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result).toBeNull();
  });

  // ── rsvpCounts ────────────────────────────────────────────────────────────

  it("counts rsvps correctly with all three statuses present", async () => {
    const rsvps = makeRsvps({ going: 3, maybe: 2, declined: 1 });
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), rsvps, null);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts).toEqual({ going: 3, maybe: 2, declined: 1 });
  });

  it("returns zero counts when there are no rsvps", async () => {
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts).toEqual({ going: 0, maybe: 0, declined: 0 });
  });

  it("counts only 'going' rsvps correctly", async () => {
    const rsvps = makeRsvps({ going: 5 });
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), rsvps);
    (createClient as Mock).mockResolvedValue(mock);

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
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.rsvpCounts).toEqual({ going: 1, maybe: 0, declined: 0 });
  });

  // ── isLive ────────────────────────────────────────────────────────────────

  it("isLive is true when NOW is between starts_at and ends_at", async () => {
    // NOW = 2026-03-11T15:00Z, event = 14:00–16:00 UTC
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(true);
  });

  it("isLive is false when NOW is before starts_at", async () => {
    const event = makeBaseEvent({
      starts_at: "2026-03-11T16:00:00.000Z",
      ends_at: "2026-03-11T17:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(false);
  });

  it("isLive is false when NOW is after ends_at", async () => {
    const event = makeBaseEvent({
      starts_at: "2026-03-11T12:00:00.000Z",
      ends_at: "2026-03-11T14:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isLive).toBe(false);
  });

  it("isLive is true when NOW equals starts_at (boundary)", async () => {
    const event = makeBaseEvent({
      starts_at: NOW.toISOString(),
      ends_at: "2026-03-11T16:00:00.000Z",
    });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as Mock).mockResolvedValue(mock);

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
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isPast).toBe(true);
  });

  it("isPast is false when ends_at is after NOW", async () => {
    // Event ends 16:00, NOW is 15:00
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.isPast).toBe(false);
  });

  it("isPast is false when event is currently live", async () => {
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    // isLive and isPast are mutually exclusive when live
    expect(result?.isLive).toBe(true);
    expect(result?.isPast).toBe(false);
  });

  // ── currentUserRsvp ───────────────────────────────────────────────────────

  it("returns the user's rsvp when found", async () => {
    const userRsvp = { status: "going", user_id: "user-1", event_id: "event-1" };
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), makeRsvps({ going: 1 }), userRsvp);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.currentUserRsvp).toEqual(userRsvp);
  });

  it("returns null for currentUserRsvp when user has not RSVPed", async () => {
    const mock = buildClientWithSequentialRsvps(makeBaseEvent(), [], null);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.currentUserRsvp).toBeNull();
  });

  // ── field pass-through ────────────────────────────────────────────────────

  it("includes all base event fields in the returned object", async () => {
    const event = makeBaseEvent({ title: "My Event", location: "Room 101" });
    const mock = buildClientWithSequentialRsvps(event, []);
    (createClient as Mock).mockResolvedValue(mock);

    const result = await fetchEventWithDetails("event-1", "user-1");
    expect(result?.title).toBe("My Event");
    expect(result?.location).toBe("Room 101");
    expect(result?.id).toBe("event-1");
  });
});

// ── upsertGoogleCalendarEvent ─────────────────────────────────────────────────

describe("upsertGoogleCalendarEvent", () => {
  function buildUpsertClient(result: { data: unknown; error: unknown }) {
    const single = vi.fn().mockResolvedValue(result);
    const select = vi.fn().mockReturnValue({ single });
    const upsert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ upsert });
    return { client: { from }, upsert, select, single };
  }

  it("upserts with google_event_id conflict key and required event fields", async () => {
    const syncedEvent = {
      google_event_id: "gcal-abc123",
      title: "Community Standup",
      description: "Weekly sync",
      starts_at: "2026-07-02T18:00:00.000Z",
      ends_at: "2026-07-02T19:00:00.000Z",
      location: "Zoom",
    };
    const { client, upsert } = buildUpsertClient({
      data: { id: "event-2", ...syncedEvent, event_type: "other" },
      error: null,
    });

    await upsertGoogleCalendarEvent(client, syncedEvent);

    expect(upsert).toHaveBeenCalledWith(
      {
        google_event_id: "gcal-abc123",
        title: "Community Standup",
        description: "Weekly sync",
        starts_at: "2026-07-02T18:00:00.000Z",
        ends_at: "2026-07-02T19:00:00.000Z",
        location: "Zoom",
        event_type: "other",
        timezone: "America/Chicago",
      },
      { onConflict: "google_event_id" }
    );
  });

  it("uses join_url as location when location is omitted", async () => {
    const { client, upsert } = buildUpsertClient({ data: null, error: null });

    await upsertGoogleCalendarEvent(client, {
      google_event_id: "gcal-xyz",
      title: "Office Hours",
      starts_at: "2026-07-03T18:00:00.000Z",
      ends_at: "2026-07-03T19:00:00.000Z",
      join_url: "https://meet.google.com/abc-defg-hij",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        location: "https://meet.google.com/abc-defg-hij",
      }),
      { onConflict: "google_event_id" }
    );
  });

  it("defaults location to Online when neither location nor join_url is provided", async () => {
    const { client, upsert } = buildUpsertClient({ data: null, error: null });

    await upsertGoogleCalendarEvent(client, {
      google_event_id: "gcal-none",
      title: "TBD Location Event",
      starts_at: "2026-07-04T18:00:00.000Z",
      ends_at: "2026-07-04T19:00:00.000Z",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ location: "Online" }),
      { onConflict: "google_event_id" }
    );
  });
});
