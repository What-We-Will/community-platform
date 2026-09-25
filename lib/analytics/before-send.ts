import type { AnalyticsBrowserEvent } from "./types";
import { isCapturablePath } from "./allowed-routes";
import { scrubUrl } from "./url-scrub";

// Shape-based rules, not a key deny-list: the SDK grows new URL channel
// families across snapshots ($initial_*, $session_entry_*), and an enumerated
// key list silently misses the next one.
const URL_VALUED_KEY_SUFFIX = /(_url|_pathname|_referrer)$/;
const EXACT_URL_KEYS = ["$pathname", "$referrer"];
const UTM_KEY = /(^|_)utm_/;

// Autocapture serializes clicked elements as `key="value"` pairs joined by
// ";". The pinned SDK re-adds anchor hrefs (as both `href` and `attr__href`)
// even with mask_all_element_attributes on, so they are scrubbed here.
const CHAIN_HREF = /((?:attr__)?href)="((?:[^"\\]|\\.)*)"/g;

function scrubRecord(record: Record<string, unknown>, origin: string): void {
  for (const key of Object.keys(record)) {
    // Campaign params originate in the query string, which is stripped by
    // default — the property copies go with it.
    if (UTM_KEY.test(key)) {
      delete record[key];
      continue;
    }
    const value = record[key];
    if (
      typeof value === "string" &&
      (EXACT_URL_KEYS.includes(key) || URL_VALUED_KEY_SUFFIX.test(key))
    ) {
      record[key] = scrubUrl(value, origin);
    }
  }
}

function scrubElements(
  properties: Record<string, unknown>,
  origin: string
): void {
  const chain = properties.$elements_chain;
  if (typeof chain === "string") {
    properties.$elements_chain = chain.replace(
      CHAIN_HREF,
      (_, key: string, value: string) =>
        `${key}="${scrubUrl(value, origin) ?? ""}"`
    );
  }
  const elements = properties.$elements;
  if (Array.isArray(elements)) {
    for (const element of elements) {
      if (element && typeof element === "object") {
        const record = element as Record<string, unknown>;
        for (const key of ["attr__href", "href"]) {
          if (typeof record[key] === "string") {
            record[key] = scrubUrl(record[key] as string, origin) ?? "";
          }
        }
      }
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
 * URL channels including `$set`/`$set_once` person-property payloads and the
 * autocapture element payloads.
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
      scrubElements(event.properties, origin);
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
