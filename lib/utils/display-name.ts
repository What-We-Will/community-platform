/**
 * Shared display-name bound, enforced at every layer that accepts one:
 * `completeOnboarding`, `updateProfile`, both form inputs (`maxLength`), and a
 * Postgres CHECK constraint on `public.profiles`.
 */
export const DISPLAY_NAME_MAX_LENGTH = 100;

/** User-facing copy for a missing name, shared so both write paths agree. */
export const DISPLAY_NAME_REQUIRED_ERROR = "Please provide a display name.";

/** User-facing copy for an oversized name, shared so both write paths agree. */
export const DISPLAY_NAME_TOO_LONG_ERROR = `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;

/**
 * Count a display name the way PostgreSQL's `char_length()` does.
 *
 * `String.prototype.length` counts UTF-16 code units, so a single astral-plane
 * emoji measures 2 in JavaScript but 1 in Postgres. Counting code points keeps
 * the TypeScript guard and the CHECK constraint from disagreeing about which
 * names are acceptable.
 *
 * @param value - The name to measure; assumed already normalized.
 * @returns The number of Unicode code points.
 */
export function displayNameLength(value: string): number {
  return Array.from(value).length;
}

/**
 * Trim a submitted display name into the form that gets persisted.
 *
 * Non-string input yields an empty string, which `validateDisplayName` then
 * rejects — a mistyped value fails closed rather than reaching the database.
 *
 * @param value - Raw submitted name.
 * @returns The trimmed name, or `""` when absent.
 */
export function normalizeDisplayName(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validate a submitted display name for a server action.
 *
 * Measures the normalized value, so surrounding whitespace neither satisfies
 * the presence requirement nor counts against the length limit.
 *
 * @param value - Raw submitted name; `null`/`undefined`/blank means "absent".
 * @returns An error message to surface to the user, or `null` if acceptable.
 */
export function validateDisplayName(
  value: string | null | undefined
): string | null {
  const normalized = normalizeDisplayName(value);
  if (!normalized) return DISPLAY_NAME_REQUIRED_ERROR;
  if (displayNameLength(normalized) > DISPLAY_NAME_MAX_LENGTH) {
    return DISPLAY_NAME_TOO_LONG_ERROR;
  }
  return null;
}
