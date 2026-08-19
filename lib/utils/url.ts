/**
 * Return true only for a well-formed URL whose scheme is `https:`.
 *
 * Input validation ("is this a URL we accept?") — a separate concern from HTML
 * output encoding (see `escapeHtml` in `./html`), which is why the two live in
 * separate modules. Rejects `http:`, `javascript:`, `data:`, any other scheme,
 * and anything the WHATWG URL parser cannot parse.
 *
 * Takes a required `string`. Presence ("was a URL even provided?") is the
 * caller's decision, not this predicate's — an absent optional field is not the
 * same as an invalid one. Narrow nullable values before calling.
 *
 * @param url - Candidate URL string; caller resolves absence beforehand.
 * @returns `true` only if `url` parses and its protocol is exactly `https:`.
 * @example
 * isHttpsUrl("https://github.com/octocat"); // → true
 * isHttpsUrl("http://example.com");          // → false (not https)
 * isHttpsUrl("javascript:alert(1)");         // → false (dangerous scheme)
 * isHttpsUrl("not-a-url");                    // → false (unparseable)
 */
export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize a submitted link into the exact form that should be persisted.
 *
 * The WHATWG URL parser strips leading/trailing C0-and-space and removes all
 * ASCII tab and newline characters *before* parsing, so `isHttpsUrl` accepts
 * strings that still contain them. Storing the raw value would mean validating
 * one representation and persisting another; this collapses that gap by
 * removing exactly what the parser ignores.
 *
 * @param value - Raw submitted link; `null`/`undefined`/blank means "absent".
 * @returns The cleaned link, or `null` when nothing meaningful was submitted.
 * @example
 * normalizeSubmittedUrl("  https://github.com/jane  "); // → "https://github.com/jane"
 * normalizeSubmittedUrl("https://git\thub.com/jane");   // → "https://github.com/jane"
 * normalizeSubmittedUrl("   ");                          // → null
 */
export function normalizeSubmittedUrl(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  return value.replace(/[\t\n\r]/g, "").trim() || null;
}

/** User-facing copy for a rejected link, shared so both write paths agree. */
export const HTTPS_URL_ERROR =
  "Please provide a valid URL starting with https:// (e.g. https://github.com/username)";

/**
 * Validate an optional user-submitted profile link for a server action.
 *
 * Wraps `isHttpsUrl` in the absence-vs-invalid distinction the predicate
 * deliberately leaves to callers: an omitted link is not an error, a
 * non-https one is. Shared by every write path that stores these links so
 * the https-only rule cannot hold in one and lapse in another.
 *
 * @param url - Candidate link; `null`/`undefined`/empty means "not provided".
 * @returns An error message to surface to the user, or `null` if acceptable.
 */
export function validateHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return isHttpsUrl(url) ? null : HTTPS_URL_ERROR;
}
