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

const _tzCache = new Map<string, string>();

/**
 * Validate an IANA timezone string. Returns the timezone if valid,
 * or the default timezone as a safe fallback.
 * Results are cached to avoid repeated Intl.DateTimeFormat construction.
 */
export function safeTimezone(tz: string | null | undefined): string {
  if (!tz || tz.trim() === "") return DEFAULT_TIMEZONE;
  const cached = _tzCache.get(tz);
  if (cached !== undefined) return cached;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    _tzCache.set(tz, tz);
    return tz;
  } catch {
    _tzCache.set(tz, DEFAULT_TIMEZONE);
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

/**
 * Extracts the region prefix from an IANA timezone string.
 * Returns "" for flat names (e.g. "UTC") or null/undefined input,
 * which causes prioritizeTimezones to skip region sorting.
 *
 * Example: getTimezoneRegion("America/Chicago") → "America"
 *          getTimezoneRegion("UTC")             → ""
 */
export function getTimezoneRegion(tz: string | null | undefined): string {
  if (!tz || !tz.includes("/")) return "";
  return tz.split("/")[0];
}

/**
 * Ensures `selected` appears at the front of `list`.
 * No-ops if `selected` is already first or not present in the list.
 */
function pinSelected(selected: string, list: string[]): string[] {
  if (!selected || list[0] === selected) return list;
  const without = list.filter((tz) => tz !== selected);
  return list.includes(selected) ? [selected, ...without] : list;
}

/**
 * Returns a capped list of timezones for a default (no-search) picker view.
 * Timezones in the same region as `selectedValue` are sorted first so the
 * most relevant choices appear without the user having to type.
 *
 * Example: prioritizeTimezones("America/Chicago", allTzs, 50)
 *          → all America/* first, then others, total ≤ 50
 */
export function prioritizeTimezones(
  selectedValue: string,
  allTimezones: string[],
  maxVisible = 50
): string[] {
  const region = getTimezoneRegion(selectedValue);
  // Flat names like "UTC" have no region — pin so they survive the cap.
  if (!region) return pinSelected(selectedValue, allTimezones).slice(0, maxVisible);
  const sameRegion = allTimezones.filter((tz) => tz.startsWith(region + "/"));
  const others = allTimezones.filter((tz) => !tz.startsWith(region + "/"));
  const pinned = pinSelected(selectedValue, sameRegion);
  return [...pinned, ...others].slice(0, maxVisible);
}
