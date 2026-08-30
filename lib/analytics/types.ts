/**
 * Minimal structural view of a posthog-js capture event as seen by the
 * `before_send` hook. Kept local so the scrub and gate can be unit-tested
 * without importing browser-only SDK modules into node test environments.
 */
export interface AnalyticsEventProperties {
  [key: string]: unknown;
  $current_url?: string;
  $pathname?: string;
  $referrer?: string;
  $referring_domain?: string;
  $prev_pageview_pathname?: string;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
}

export interface AnalyticsBrowserEvent {
  event: string;
  properties: AnalyticsEventProperties;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
}
