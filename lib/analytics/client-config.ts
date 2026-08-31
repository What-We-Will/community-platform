import type { PostHogConfig } from "posthog-js";
import { buildBeforeSend } from "./before-send";

/**
 * Privacy-mandatory PostHog client configuration. Every explicit disable below
 * is load-bearing: several SDK surfaces treat `undefined` as "follow remote
 * config", so a dashboard toggle could otherwise enable them with no code
 * review. Do not remove a flag because "the dashboard has it off" — see
 * docs/adr/posthog-product-analytics.md.
 *
 * `defaults` is pinned to the snapshot we reviewed; adopting a newer snapshot
 * requires reviewing PostHog's behavior-change notes first (ADR policy).
 */
export function buildPosthogClientConfig({
  origin,
}: {
  origin: string;
}): Partial<PostHogConfig> {
  return {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    disable_session_recording: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    disable_surveys: true,
    disable_conversations: true,
    disable_product_tours: true,
    disable_web_experiments: true,
    capture_exceptions: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    before_send: buildBeforeSend({ origin }),
  };
}
