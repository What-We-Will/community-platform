/**
 * @vitest-environment node
 */
import { makeCaptureEvent } from "@/lib/__tests__/factories";
import type { AnalyticsBrowserEvent } from "./types";
import { buildBeforeSend } from "./before-send";

const ORIGIN = "https://community.example.org";
const UUID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

describe("before_send URL-surface scrub — every URL channel leaves templated and stripped", () => {
  const beforeSend = buildBeforeSend({ origin: ORIGIN });

  function scrubbed(): AnalyticsBrowserEvent {
    // One synthetic event with every URL channel populated (adversarial case).
    const event = makeCaptureEvent({
      properties: {
        $current_url: `${ORIGIN}/members/${UUID}?q=Jane%20Doe`,
        $pathname: `/members/${UUID}`,
        $referrer: `${ORIGIN}/messages/${UUID}?tab=archive`,
        $referring_domain: "community.example.org",
        $prev_pageview_pathname: `/groups/quiet-search`,
        utm_source: "linkedin",
        $set_once: {
          $initial_current_url: `${ORIGIN}/members/${UUID}?q=secret`,
          $initial_pathname: `/members/${UUID}`,
          $initial_referrer: "https://www.linkedin.com/in/jane-doe",
          $initial_referring_domain: "www.linkedin.com",
          $initial_utm_source: "linkedin",
        },
      },
      $set_once: {
        $initial_current_url: `${ORIGIN}/members/${UUID}?q=secret`,
        $initial_referrer: "https://www.linkedin.com/in/jane-doe",
      },
    });
    const result = beforeSend(event);
    expect(result).not.toBeNull();
    return result as AnalyticsBrowserEvent;
  }

  it("should template and strip $current_url when it carries an id and query", () => {
    expect(scrubbed().properties.$current_url).toBe(`${ORIGIN}/members/[userId]`);
  });

  it("should template $pathname when it carries an id", () => {
    expect(scrubbed().properties.$pathname).toBe("/members/[userId]");
  });

  it("should template and strip an internal $referrer when it carries an id and query", () => {
    expect(scrubbed().properties.$referrer).toBe(`${ORIGIN}/messages/[conversationId]`);
  });

  it("should reduce an external $referrer to domain only when it carries a path", () => {
    const event = makeCaptureEvent({
      properties: {
        $referrer: "https://www.linkedin.com/in/jane-doe?trk=x",
      },
    });

    const result = beforeSend(event) as AnalyticsBrowserEvent;

    expect(result.properties.$referrer).toBe("https://www.linkedin.com");
  });

  it("should template the pageleave previous-page pathname when it carries a slug", () => {
    expect(scrubbed().properties.$prev_pageview_pathname).toBe("/groups/[slug]");
  });

  it("should remove utm event properties when the landing URL carried campaign params", () => {
    expect(scrubbed().properties).not.toHaveProperty("utm_source");
  });

  it("should scrub the $set_once initial URL properties when they carry ids and queries", () => {
    const setOnce = scrubbed().properties.$set_once as Record<string, unknown>;

    expect(setOnce.$initial_current_url).toBe(`${ORIGIN}/members/[userId]`);
    expect(setOnce.$initial_pathname).toBe("/members/[userId]");
    expect(setOnce.$initial_referrer).toBe("https://www.linkedin.com");
    expect(setOnce).not.toHaveProperty("$initial_utm_source");
  });

  it("should scrub the top-level $set_once payload when the SDK attaches one", () => {
    const topLevel = scrubbed().$set_once as Record<string, unknown>;

    expect(topLevel.$initial_current_url).toBe(`${ORIGIN}/members/[userId]`);
    expect(topLevel.$initial_referrer).toBe("https://www.linkedin.com");
  });
});
