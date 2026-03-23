import {
  fromZonedTime,
  formatInTimeZone as dateFnsFormatInTimeZone,
} from "date-fns-tz";

// UTC Storage Assumption
// This module assumes Supabase/Postgres is configured with timezone = 'UTC' (the default).
// localTimeToUTC converts browser-local times to UTC before storage.
// formatInTimeZone converts stored UTC back to a display timezone.
// If the DB timezone setting changes, all stored timestamps will be misinterpreted.

const DEFAULT_TIMEZONE = "America/Chicago";

/**
 * Validate an IANA timezone string. Returns the timezone if valid,
 * or the default timezone as a safe fallback.
 */
export function safeTimezone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TIMEZONE;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Convert a naive date + time string (from an input field) in a given
 * IANA timezone to a UTC ISO string for storage.
 *
 * Example: localTimeToUTC("2026-03-26", "14:00", "America/New_York")
 *        → "2026-03-26T18:00:00.000Z"
 */
export function localTimeToUTC(
  date: string,
  time: string,
  tz: string,
): string {
  return fromZonedTime(`${date}T${time}`, safeTimezone(tz)).toISOString();
}

/**
 * Format a UTC ISO string in a specific IANA timezone.
 * Parameter order matches date-fns-tz: (date, timezone, format).
 *
 * Example: formatInTimeZone("2026-03-26T18:00:00Z", "America/New_York", "h:mm a")
 *        → "2:00 PM"
 */
export function formatInTimeZone(
  utcISO: string,
  tz: string,
  fmt: string,
): string {
  return dateFnsFormatInTimeZone(utcISO, safeTimezone(tz), fmt);
}

/**
 * Get the short timezone abbreviation for display.
 * Parameter order: date-first, timezone-second (consistent with formatInTimeZone).
 *
 * Example: getTimeZoneAbbreviation("2026-03-26T18:00:00Z", "America/New_York") → "EDT"
 */
export function getTimeZoneAbbreviation(utcISO: string, tz: string): string {
  return dateFnsFormatInTimeZone(utcISO, safeTimezone(tz), "zzz");
}
