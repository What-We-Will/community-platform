/**
 * @vitest-environment node
 */
import { config } from "./proxy";

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: vi.fn(),
}));

// The matcher is a single path-to-regexp pattern of the form "/((?!…).*)";
// its parenthesized group is plain regex, so anchoring it reproduces the
// route-matching behavior Next.js applies.
const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher — PostHog ingest exclusion stays tight", () => {
  it.each([
    ["/ingest/e"],
    ["/ingest/flags"],
    ["/ingest/s/"],
    ["/ingest/static/array.js"],
  ])("should exempt the ingest endpoint %s from session middleware", (path) => {
    expect(matcher.test(path)).toBe(false);
  });

  it.each([
    ["/ingest"],
    ["/ingestion/anything"],
    ["/ingest-relay/e"],
  ])(
    "should keep %s under session middleware when it is not the ingest subtree",
    (path) => {
      expect(matcher.test(path)).toBe(true);
    }
  );

  it.each([["/dashboard"], ["/login"], ["/members/abc"], ["/"]])(
    "should keep the app route %s under session middleware",
    (path) => {
      expect(matcher.test(path)).toBe(true);
    }
  );

  it.each([
    ["/_next/static/chunk.js"],
    ["/api/health"],
    ["/favicon.ico"],
    ["/images/logo.png"],
  ])("should keep the pre-existing exemption for %s", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
