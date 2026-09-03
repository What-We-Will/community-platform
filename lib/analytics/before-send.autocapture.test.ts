/**
 * @vitest-environment node
 */
import { makeCaptureEvent } from "@/lib/__tests__/factories";
import type { AnalyticsBrowserEvent } from "./types";
import { buildBeforeSend } from "./before-send";

const ORIGIN = "https://community.example.org";
const UUID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

// Payload shape mirrors posthog-js 1.422.5 autocapture: anchor hrefs are
// re-added (as `href` and `attr__href`) even with mask_all_element_attributes
// on, in both the $elements_chain string and the $elements array, plus
// $external_click_url on external clicks.
describe("before_send autocapture scrub — element hrefs and click URLs never leave raw", () => {
  const beforeSend = buildBeforeSend({ origin: ORIGIN });

  function scrubbedAutocapture(): AnalyticsBrowserEvent {
    const event = makeCaptureEvent({
      event: "$autocapture",
      properties: {
        $event_type: "click",
        $current_url: `${ORIGIN}/dashboard`,
        $pathname: "/dashboard",
        $elements_chain:
          `a.member-link:attr__href="/members/${UUID}?q=Jane%20Doe"` +
          `href="/members/${UUID}?q=Jane%20Doe"nth-child="2"nth-of-type="1";` +
          `div:nth-child="1"nth-of-type="1"`,
        $elements: [
          {
            tag_name: "a",
            attr__href: `/members/${UUID}?q=Jane%20Doe`,
            nth_child: 2,
            nth_of_type: 1,
          },
          { tag_name: "div", nth_child: 1, nth_of_type: 1 },
        ],
        $external_click_url: "https://jobs.example.com/postings/12345?ref=me",
      },
    });
    const result = beforeSend(event);
    expect(result).not.toBeNull();
    return result as AnalyticsBrowserEvent;
  }

  it("should template and strip both href encodings in the elements chain when a link carries an id and query", () => {
    expect(scrubbedAutocapture().properties.$elements_chain).toBe(
      `a.member-link:attr__href="/members/[userId]"` +
        `href="/members/[userId]"nth-child="2"nth-of-type="1";` +
        `div:nth-child="1"nth-of-type="1"`
    );
  });

  it("should template and strip the element array href when a link carries an id and query", () => {
    const elements = scrubbedAutocapture().properties.$elements as Record<
      string,
      unknown
    >[];

    expect(elements[0].attr__href).toBe("/members/[userId]");
  });

  it("should reduce the external click URL to origin only when a link leaves the site", () => {
    expect(scrubbedAutocapture().properties.$external_click_url).toBe(
      "https://jobs.example.com"
    );
  });

  it("should scrub an unparseable chain href to empty when the value is not a URL", () => {
    const event = makeCaptureEvent({
      event: "$autocapture",
      properties: {
        $pathname: "/dashboard",
        $elements_chain: `a:href="mailto:jane@example.com"nth-child="1"`,
      },
    });

    const result = beforeSend(event) as AnalyticsBrowserEvent;

    expect(result.properties.$elements_chain).toBe(`a:href=""nth-child="1"`);
  });
});
