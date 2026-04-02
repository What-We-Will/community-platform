/**
 * @jest-environment node
 */
import {
  safeTimezone,
  localTimeToUTC,
  formatInTimeZone,
  getTimeZoneAbbreviation,
  getTimezoneRegion,
  prioritizeTimezones,
} from "./timezone";

describe("safeTimezone", () => {
  it.each([
    ["returns valid timezone as-is",         "America/New_York", "America/New_York"],
    ["returns default for null",             null,               "America/Chicago"],
    ["returns default for undefined",        undefined,          "America/Chicago"],
    ["returns default for empty string",     "",                 "America/Chicago"],
    ["returns default for invalid timezone", "Not/A_Zone",       "America/Chicago"],
  ])("%s", (_desc, input, expected) => {
    expect(safeTimezone(input)).toBe(expected);
  });
});

describe("localTimeToUTC", () => {
  it("converts Eastern time to UTC", () => {
    // EDT (March = daylight saving): ET is UTC-4
    const result = localTimeToUTC("2026-03-26", "14:00", "America/New_York");
    expect(result).toBe("2026-03-26T18:00:00.000Z");
  });

  it("converts Pacific time to UTC", () => {
    // PDT (March = daylight saving): PT is UTC-7
    const result = localTimeToUTC("2026-03-26", "14:00", "America/Los_Angeles");
    expect(result).toBe("2026-03-26T21:00:00.000Z");
  });

  it("converts Central time to UTC", () => {
    // CDT (March = daylight saving): CT is UTC-5
    const result = localTimeToUTC("2026-03-26", "14:00", "America/Chicago");
    expect(result).toBe("2026-03-26T19:00:00.000Z");
  });

  it("handles DST spring-forward boundary", () => {
    // US clocks spring forward on March 8, 2026 at 2:00 AM
    // 1:00 AM EST = UTC-5 → 06:00 UTC
    const beforeSpring = localTimeToUTC("2026-03-07", "01:00", "America/New_York");
    expect(beforeSpring).toBe("2026-03-07T06:00:00.000Z");

    // March 9 at 1:00 AM EDT = UTC-4 → 05:00 UTC
    const afterSpring = localTimeToUTC("2026-03-09", "01:00", "America/New_York");
    expect(afterSpring).toBe("2026-03-09T05:00:00.000Z");
  });

  it("handles DST fall-back boundary", () => {
    // US clocks fall back on November 1, 2026 at 2:00 AM
    // Oct 31 at 14:00 EDT = UTC-4 → 18:00 UTC
    const beforeFall = localTimeToUTC("2026-10-31", "14:00", "America/New_York");
    expect(beforeFall).toBe("2026-10-31T18:00:00.000Z");

    // Nov 2 at 14:00 EST = UTC-5 → 19:00 UTC
    const afterFall = localTimeToUTC("2026-11-02", "14:00", "America/New_York");
    expect(afterFall).toBe("2026-11-02T19:00:00.000Z");
  });
});

describe("formatInTimeZone", () => {
  it("formats UTC time in Eastern timezone", () => {
    // 18:00 UTC in EDT (UTC-4) = 14:00 = 2:00 PM
    const result = formatInTimeZone("2026-03-26T18:00:00.000Z", "America/New_York", "h:mm a");
    expect(result).toBe("2:00 PM");
  });

  it("formats UTC time in Pacific timezone", () => {
    // 18:00 UTC in PDT (UTC-7) = 11:00 AM
    const result = formatInTimeZone("2026-03-26T18:00:00.000Z", "America/Los_Angeles", "h:mm a");
    expect(result).toBe("11:00 AM");
  });

  it("formats date correctly in timezone", () => {
    const result = formatInTimeZone("2026-03-26T18:00:00.000Z", "America/New_York", "EEE, MMM d");
    expect(result).toBe("Thu, Mar 26");
  });

  it("formats full date and time", () => {
    const result = formatInTimeZone(
      "2026-03-26T18:00:00.000Z",
      "America/New_York",
      "EEEE, MMMM d, yyyy 'at' h:mm a",
    );
    expect(result).toBe("Thursday, March 26, 2026 at 2:00 PM");
  });
});

describe("getTimeZoneAbbreviation", () => {
  // Assertions accept both forms to handle ICU variance across Node builds (e.g. full
  // ICU → "EDT", slim/system ICU → "GMT-4") — do not further relax to toContain or
  // skip. If CI uses slim/system ICU, check that the Node image was built with
  // --with-intl=full-icu.
  it("returns EDT for Eastern in summer", () => {
    const result = getTimeZoneAbbreviation("2026-07-15T18:00:00.000Z", "America/New_York");
    expect(result).toMatch(/^(EDT|GMT-4)$/);
  });

  it("returns EST for Eastern in winter", () => {
    const result = getTimeZoneAbbreviation("2026-12-15T18:00:00.000Z", "America/New_York");
    expect(result).toMatch(/^(EST|GMT-5)$/);
  });

  it("returns CDT for Central in summer", () => {
    const result = getTimeZoneAbbreviation("2026-07-15T18:00:00.000Z", "America/Chicago");
    expect(result).toMatch(/^(CDT|GMT-5)$/);
  });
});

describe("getTimezoneRegion", () => {
  it.each([
    ["returns region prefix for standard IANA zone",         "America/Chicago",              "America"],
    ["returns region prefix for another standard IANA zone", "America/New_York",             "America"],
    ["returns region prefix for sub-region IANA zone",       "America/Indiana/Indianapolis", "America"],
    ["returns region prefix for European zone",              "Europe/Berlin",                "Europe"],
    ["returns region prefix for Asian zone",                 "Asia/Tokyo",                   "Asia"],
    ["returns empty string for flat name (UTC)",             "UTC",                          ""],
    ["returns empty string for null",                        null,                           ""],
  ])("%s", (_desc, input, expected) => {
    expect(getTimezoneRegion(input)).toBe(expected);
  });
});

describe("prioritizeTimezones", () => {
  const tzs = ["Africa/Abidjan", "America/Chicago", "America/New_York", "Europe/Berlin", "UTC"];

  it("sorts selected region first", () => {
    const result = prioritizeTimezones("America/Chicago", tzs, 10);
    expect(result[0]).toBe("America/Chicago");
    expect(result[1]).toBe("America/New_York");
  });

  it("pins selected value at index 0 even when not first alphabetically in its region", () => {
    const result = prioritizeTimezones("America/New_York", tzs, 10);
    expect(result[0]).toBe("America/New_York");
  });

  it("pins UTC (flat name, no region) at index 0", () => {
    const result = prioritizeTimezones("UTC", tzs, 3);
    expect(result[0]).toBe("UTC");
    expect(result).toHaveLength(3);
  });

  it("respects maxVisible cap", () => {
    const result = prioritizeTimezones("America/Chicago", tzs, 2);
    expect(result).toHaveLength(2);
  });
});

describe("round-trip: localTimeToUTC → formatInTimeZone", () => {
  it("round-trips correctly for Eastern", () => {
    const utc = localTimeToUTC("2026-03-26", "14:00", "America/New_York");
    const time = formatInTimeZone(utc, "America/New_York", "HH:mm");
    const date = formatInTimeZone(utc, "America/New_York", "yyyy-MM-dd");
    expect(time).toBe("14:00");
    expect(date).toBe("2026-03-26");
  });

  it("round-trips correctly for Pacific", () => {
    const utc = localTimeToUTC("2026-06-15", "09:30", "America/Los_Angeles");
    const time = formatInTimeZone(utc, "America/Los_Angeles", "HH:mm");
    const date = formatInTimeZone(utc, "America/Los_Angeles", "yyyy-MM-dd");
    expect(time).toBe("09:30");
    expect(date).toBe("2026-06-15");
  });

  it("round-trips correctly for timezone east of UTC", () => {
    const utc = localTimeToUTC("2026-03-26", "20:00", "Europe/Berlin");
    const time = formatInTimeZone(utc, "Europe/Berlin", "HH:mm");
    const date = formatInTimeZone(utc, "Europe/Berlin", "yyyy-MM-dd");
    expect(time).toBe("20:00");
    expect(date).toBe("2026-03-26");
  });
});
