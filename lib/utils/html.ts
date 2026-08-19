/**
 * Escape the five HTML-significant characters to prevent markup/script injection.
 *
 * Output encoding for HTML **text** and **quoted** attribute values (for
 * example, a server-rendered nodemailer email body) — not HTML sanitization.
 * Escapes `&` `<` `>` `"` `'` (single quote as `&#39;`), replacing `&` first so
 * existing entities are not double-encoded.
 *
 * Not safe — do not use the output — in these contexts:
 * - Unquoted attributes (space, `=`, backtick unescaped) — keep values quoted.
 * - Inside `<script>`/`<style>` — entities aren't parsed; use `JSON.stringify`.
 * - URL in `href`/`src` — a `javascript:` scheme survives; validate separately.
 *
 * Not idempotent, so escape each raw value once. Non-string input (`null`,
 * `undefined`, numbers, objects) returns an empty string — it is never coerced,
 * so a mistyped value fails closed instead of leaking `"null"` into the output.
 *
 * @param value - The raw value to escape; non-strings yield an empty string.
 * @returns The escaped string, safe for HTML text or quoted-attribute contexts.
 * @example
 * // Neutralizes an injection payload:
 * escapeHtml('<img src=x onerror="alert(1)">');
 * // → "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
 * @example
 * // Ordinary text with mixed quotes and ampersands:
 * escapeHtml(`Tom & "Jerry's" cat`);
 * // → "Tom &amp; &quot;Jerry&#39;s&quot; cat"
 */
export function escapeHtml(value: unknown): string {
  if (typeof value !== "string") return ""; // fail closed on non-string input
  return value
    .replace(/&/g, "&amp;") // must run first
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
