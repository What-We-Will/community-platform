import { buildRecurrenceDates } from "./recurrence";

// Helper: extract just the UTC date string ("YYYY-MM-DD") from an ISO timestamp
function toDate(iso: string) {
  return iso.slice(0, 10);
}

// Helper: returns UTC day-of-week name for readability in assertions
function dayName(iso: string) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[new Date(iso).getUTCDay()];
}

// Helper: returns the local day-of-week name in a given IANA timezone
function localDayName(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(
    new Date(iso)
  );
}

// Parent event: Wednesday 2026-03-11 10:00–11:00 UTC
const PARENT_STARTS = "2026-03-11T10:00:00.000Z"; // Wednesday
const PARENT_ENDS   = "2026-03-11T11:00:00.000Z";
const DURATION_MS   = 60 * 60 * 1000; // 1 hour
const TZ = "UTC";

describe("buildRecurrenceDates", () => {
  // ── Empty / edge cases ──────────────────────────────────────────────────────

  it("returns empty array when end date is before the parent date", () => {
    const result = buildRecurrenceDates(
      PARENT_STARTS, PARENT_ENDS, "weekly", "2026-03-10", TZ
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty array when end date equals the parent date", () => {
    const result = buildRecurrenceDates(
      PARENT_STARTS, PARENT_ENDS, "weekly", "2026-03-11", TZ
    );
    expect(result).toHaveLength(0);
  });

  it("returns empty array when maxInstances is 0", () => {
    const result = buildRecurrenceDates(
      PARENT_STARTS, PARENT_ENDS, "weekly", "2026-12-31", TZ, 0
    );
    expect(result).toHaveLength(0);
  });

  // ── Duration preservation ───────────────────────────────────────────────────

  it("preserves event duration across all instances", () => {
    const result = buildRecurrenceDates(
      PARENT_STARTS, PARENT_ENDS, "weekly", "2026-04-30", TZ
    );
    for (const { starts_at, ends_at } of result) {
      const diff = new Date(ends_at).getTime() - new Date(starts_at).getTime();
      expect(diff).toBe(DURATION_MS);
    }
  });

  it("preserves event duration for a 90-minute event", () => {
    const starts = "2026-03-11T14:00:00.000Z";
    const ends   = "2026-03-11T15:30:00.000Z";
    const result = buildRecurrenceDates(starts, ends, "weekly", "2026-04-30", TZ);
    const expectedDuration = 90 * 60 * 1000;
    for (const { starts_at, ends_at } of result) {
      const diff = new Date(ends_at).getTime() - new Date(starts_at).getTime();
      expect(diff).toBe(expectedDuration);
    }
  });

  // ── Weekly recurrence ───────────────────────────────────────────────────────

  describe("weekly rule", () => {
    it("generates only the same weekday as the parent (Wednesday)", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "weekly", "2026-04-15", TZ
      );
      for (const { starts_at } of result) {
        expect(dayName(starts_at)).toBe("Wed");
      }
    });

    it("generates the correct number of weekly instances", () => {
      // Parent = Wed 2026-03-11, end = Wed 2026-04-08 → 4 Wednesdays: 18, 25, Apr1, 8
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "weekly", "2026-04-08", TZ
      );
      expect(result).toHaveLength(4);
    });

    it("generates instances spaced exactly 7 days apart", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "weekly", "2026-04-30", TZ
      );
      for (let i = 1; i < result.length; i++) {
        const prevMs = new Date(result[i - 1].starts_at).getTime();
        const currMs = new Date(result[i].starts_at).getTime();
        expect(currMs - prevMs).toBe(7 * 24 * 60 * 60 * 1000);
      }
    });

    it("first instance is exactly 7 days after the parent", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "weekly", "2026-04-30", TZ
      );
      const firstMs = new Date(result[0].starts_at).getTime();
      const parentMs = new Date(PARENT_STARTS).getTime();
      expect(firstMs - parentMs).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("does not exceed maxInstances", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "weekly", "2030-12-31", TZ, 5
      );
      expect(result).toHaveLength(5);
    });

    it("includes the instance on the recurrenceEndDate itself when it matches", () => {
      // Next Wednesday after 2026-03-11 is 2026-03-18
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "weekly", "2026-03-18", TZ
      );
      expect(result).toHaveLength(1);
      expect(toDate(result[0].starts_at)).toBe("2026-03-18");
    });

    it("handles parent on a Monday and generates only Mondays", () => {
      const monStarts = "2026-03-09T10:00:00.000Z"; // Monday
      const monEnds   = "2026-03-09T11:00:00.000Z";
      const result = buildRecurrenceDates(monStarts, monEnds, "weekly", "2026-04-06", TZ);
      for (const { starts_at } of result) {
        expect(dayName(starts_at)).toBe("Mon");
      }
      expect(result).toHaveLength(4);
    });
  });

  // ── Daily (weekday) recurrence ──────────────────────────────────────────────

  describe("daily rule (weekdays only)", () => {
    it("never generates a Saturday instance", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "daily", "2026-04-30", TZ
      );
      for (const { starts_at } of result) {
        expect(dayName(starts_at)).not.toBe("Sat");
      }
    });

    it("never generates a Sunday instance", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "daily", "2026-04-30", TZ
      );
      for (const { starts_at } of result) {
        expect(dayName(starts_at)).not.toBe("Sun");
      }
    });

    it("generates 5 instances for one full Mon–Fri week after a Sunday parent", () => {
      // Parent: Sun 2026-03-08, end: Fri 2026-03-13 → Mon Tue Wed Thu Fri = 5
      const sunStarts = "2026-03-08T10:00:00.000Z";
      const sunEnds   = "2026-03-08T11:00:00.000Z";
      const result = buildRecurrenceDates(sunStarts, sunEnds, "daily", "2026-03-13", TZ);
      expect(result).toHaveLength(5);
    });

    it("generates consecutive weekday instances with no gaps > 3 days", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "daily", "2026-04-30", TZ
      );
      for (let i = 1; i < result.length; i++) {
        const prevMs = new Date(result[i - 1].starts_at).getTime();
        const currMs = new Date(result[i].starts_at).getTime();
        const diffDays = (currMs - prevMs) / (24 * 60 * 60 * 1000);
        // Mon→Fri gap=1, Fri→Mon gap=3; anything larger means a bug
        expect(diffDays).toBeLessThanOrEqual(3);
      }
    });

    it("does not exceed maxInstances", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "daily", "2030-12-31", TZ, 10
      );
      expect(result).toHaveLength(10);
    });

    it("generates 0 instances when end date is the very next day and it is Saturday", () => {
      // Parent: Friday 2026-03-13, end: Saturday 2026-03-14 → no weekdays
      const friStarts = "2026-03-13T10:00:00.000Z";
      const friEnds   = "2026-03-13T11:00:00.000Z";
      const result = buildRecurrenceDates(friStarts, friEnds, "daily", "2026-03-14", TZ);
      expect(result).toHaveLength(0);
    });

    it("generates 1 instance when end date is the Monday after a Friday parent", () => {
      const friStarts = "2026-03-13T10:00:00.000Z";
      const friEnds   = "2026-03-13T11:00:00.000Z";
      const result = buildRecurrenceDates(friStarts, friEnds, "daily", "2026-03-16", TZ);
      expect(result).toHaveLength(1);
      expect(dayName(result[0].starts_at)).toBe("Mon");
    });

    it("preserves time-of-day (UTC hours/minutes) across all instances", () => {
      const result = buildRecurrenceDates(
        PARENT_STARTS, PARENT_ENDS, "daily", "2026-04-30", TZ
      );
      for (const { starts_at } of result) {
        const d = new Date(starts_at);
        expect(d.getUTCHours()).toBe(10);
        expect(d.getUTCMinutes()).toBe(0);
      }
    });
  });

  // ── Non-UTC timezone (cross-midnight UTC offset) ─────────────────────────────
  //
  // America/New_York is UTC-5 in March 2026 (EST). A 22:00 ET event stores as
  // 03:00 UTC the *next* calendar day, so the UTC date differs from the local date.
  // These tests verify that weekday logic uses the event timezone, not UTC.

  describe("non-UTC timezone (event time crosses UTC midnight)", () => {
    // Wednesday 2026-03-11 22:00 ET → 2026-03-12T03:00:00Z (Thursday UTC)
    const NY_TZ = "America/New_York";
    const NY_PARENT_STARTS = "2026-03-12T03:00:00.000Z";
    const NY_PARENT_ENDS   = "2026-03-12T04:00:00.000Z";

    it("generates only Wednesday ET instances for a weekly event at 10 PM ET (Thursday UTC)", () => {

      const result = buildRecurrenceDates(
        NY_PARENT_STARTS, NY_PARENT_ENDS, "weekly", "2026-04-08", NY_TZ
      );

      expect(result.length).toBeGreaterThan(0);
      for (const { starts_at } of result) {
        expect(localDayName(starts_at, NY_TZ)).toBe("Wed");
      }
    });

    it("skips Saturday and Sunday ET instances when UTC date and local date fall on different days", () => {
      // Friday 2026-03-13 22:00 ET → 2026-03-14T03:00:00Z (Saturday UTC).
      // Pre-fix: cursor at 2026-03-16T03:00:00Z was Sunday UTC → incorrectly treated as a weekday.
      const friStarts = "2026-03-14T03:00:00.000Z";
      const friEnds   = "2026-03-14T04:00:00.000Z";

      const result = buildRecurrenceDates(friStarts, friEnds, "daily", "2026-03-23", NY_TZ);

      expect(result.length).toBeGreaterThan(0);
      for (const { starts_at } of result) {
        expect(localDayName(starts_at, NY_TZ)).not.toBe("Sat");
        expect(localDayName(starts_at, NY_TZ)).not.toBe("Sun");
      }
    });
  });
});
