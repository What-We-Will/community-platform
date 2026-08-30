import type { AnalyticsBrowserEvent } from "./types";
import { isCapturablePath } from "./allowed-routes";
import { scrubUrl } from "./url-scrub";

const URL_VALUED_KEYS = [
  "$current_url",
  "$pathname",
  "$referrer",
  "$prev_pageview_pathname",
  "$initial_current_url",
  "$initial_pathname",
  "$initial_referrer",
];

function scrubRecord(record: Record<string, unknown>, origin: string): void {
  for (const key of Object.keys(record)) {
    // Campaign params originate in the query string, which is stripped by
    // default — the property copies go with it.
    if (key.startsWith("utm_") || key.startsWith("$initial_utm_")) {
      delete record[key];
      continue;
    }
    const value = record[key];
    if (URL_VALUED_KEYS.includes(key) && typeof value === "string") {
      record[key] = scrubUrl(value, origin);
    }
  }
}

function derivePathname(
  event: AnalyticsBrowserEvent,
  origin: string
): string | null {
  const pathname = event.properties?.$pathname;
  if (typeof pathname === "string" && pathname.startsWith("/")) {
    return pathname.split(/[?#]/)[0];
  }
  const currentUrl = event.properties?.$current_url;
  if (typeof currentUrl === "string") {
    try {
      return new URL(currentUrl, origin).pathname;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * The single choke point every client event passes through: the allowlist
 * route gate (events that cannot prove they came from an authenticated app
 * surface are dropped — fail closed), then the URL-surface scrub across all
 * URL channels including `$set`/`$set_once` person-property payloads.
 */
export function buildBeforeSend({ origin }: { origin: string }) {
  return function beforeSend<T extends AnalyticsBrowserEvent>(
    event: T | null
  ): T | null {
    if (!event) {
      return null;
    }
    const pathname = derivePathname(event, origin);
    if (!pathname || !isCapturablePath(pathname)) {
      return null;
    }
    if (event.properties) {
      scrubRecord(event.properties, origin);
      for (const nested of [event.properties.$set, event.properties.$set_once]) {
        if (nested) {
          scrubRecord(nested, origin);
        }
      }
    }
    for (const topLevel of [event.$set, event.$set_once]) {
      if (topLevel) {
        scrubRecord(topLevel, origin);
      }
    }
    return event;
  };
}
