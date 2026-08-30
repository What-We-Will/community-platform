/**
 * @vitest-environment node
 */
import { buildPosthogClientConfig } from "./client-config";

describe("PostHog client config — privacy-mandatory settings", () => {
  const config = buildPosthogClientConfig({
    origin: "https://community.example.org",
  });

  it("should route ingest through the first-party proxy path when initialized", () => {
    expect(config.api_host).toBe("/ingest");
    expect(config.ui_host).toBe("https://us.posthog.com");
  });

  it("should pin the reviewed defaults snapshot when initialized", () => {
    expect(config.defaults).toBe("2026-05-30");
  });

  it("should create person profiles for identified members only", () => {
    expect(config.person_profiles).toBe("identified_only");
  });

  it("should disable session recording locally so remote config cannot enable it", () => {
    expect(config.disable_session_recording).toBe(true);
  });

  it("should mask all autocapture text and element attributes", () => {
    expect(config.mask_all_text).toBe(true);
    expect(config.mask_all_element_attributes).toBe(true);
  });

  // Each surface below defaults to "follow remote config" when left undefined —
  // a dashboard toggle could enable it with no code review. The explicit local
  // value is the control; do not remove one because "the dashboard has it off".
  it("should disable surveys locally so a dashboard-launched survey cannot run", () => {
    expect(config.disable_surveys).toBe(true);
  });

  it("should disable exception capture locally so $exception events never send", () => {
    expect(config.capture_exceptions).toBe(false);
  });

  it("should disable dead clicks, heatmaps, and performance capture locally", () => {
    expect(config.capture_dead_clicks).toBe(false);
    expect(config.capture_heatmaps).toBe(false);
    expect(config.capture_performance).toBe(false);
  });

  it("should install a before_send hook when initialized", () => {
    expect(typeof config.before_send).toBe("function");
  });
});
