const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteTemplate {
  prefix: string;
  placeholder: string;
  /** First segments after the prefix that are real static routes, not entity ids. */
  staticChildren?: string[];
}

const ROUTE_TEMPLATES: RouteTemplate[] = [
  { prefix: "/members", placeholder: "[userId]" },
  { prefix: "/messages", placeholder: "[conversationId]" },
  { prefix: "/groups", placeholder: "[slug]" },
  { prefix: "/events", placeholder: "[eventId]", staticChildren: ["create"] },
];

export function templatePathname(pathname: string): string {
  const segments = pathname.split("/");
  const rule = ROUTE_TEMPLATES.find((r) => r.prefix === `/${segments[1] ?? ""}`);
  if (
    rule &&
    segments.length >= 3 &&
    segments[2] !== "" &&
    !(rule.staticChildren ?? []).includes(segments[2])
  ) {
    segments[2] = rule.placeholder;
  }
  // Safety net for routes without an explicit rule: a raw UUID anywhere in the
  // path is entity data and never leaves untemplated.
  return segments
    .map((segment) => (UUID_SEGMENT.test(segment) ? "[id]" : segment))
    .join("/");
}

/**
 * Scrub a single URL-bearing analytics value.
 *
 * Internal URLs (relative, or absolute on `origin`) come back with the path
 * templated and query string/hash stripped. External URLs reduce to origin
 * only. `$direct` (PostHog's non-URL referrer sentinel) passes through;
 * anything else unparseable scrubs to null (fail closed).
 */
export function scrubUrl(raw: string, origin: string): string | null {
  if (raw === "$direct") {
    return raw;
  }
  if (raw.startsWith("/")) {
    return templatePathname(raw.split(/[?#]/)[0]);
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.origin === origin) {
    return url.origin + templatePathname(url.pathname);
  }
  return url.origin;
}
