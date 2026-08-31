/**
 * @vitest-environment node
 */
import { scrubUrl } from "./url-scrub";

const ORIGIN = "https://community.example.org";
const UUID = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

describe("scrubUrl — URL privacy scrub for analytics payloads", () => {
  describe("internal URLs", () => {
    it("should template the member id when the URL is a member profile", () => {
      const raw = `${ORIGIN}/members/${UUID}`;

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe(`${ORIGIN}/members/[userId]`);
    });

    it("should template the conversation id when the URL is a message thread", () => {
      const raw = `${ORIGIN}/messages/${UUID}`;

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe(`${ORIGIN}/messages/[conversationId]`);
    });

    it("should template the group slug when the URL is a group page", () => {
      const raw = `${ORIGIN}/groups/job-search-support`;

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe(`${ORIGIN}/groups/[slug]`);
    });

    it("should template the event id when the URL is an event page", () => {
      const raw = `${ORIGIN}/events/${UUID}`;

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe(`${ORIGIN}/events/[eventId]`);
    });

    it("should leave the static create route untouched when the URL is /events/create", () => {
      const raw = `${ORIGIN}/events/create`;

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe(`${ORIGIN}/events/create`);
    });

    it("should strip the query string and hash when a filter URL carries free text", () => {
      const raw = `${ORIGIN}/members?q=Jane%20Doe&skill=react#results`;

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe(`${ORIGIN}/members`);
    });

    it("should template a relative pathname when given a bare path", () => {
      const result = scrubUrl(`/messages/${UUID}`, ORIGIN);

      expect(result).toBe("/messages/[conversationId]");
    });

    it("should template an unmapped uuid segment when the route has no explicit rule", () => {
      const result = scrubUrl(`/links/${UUID}`, ORIGIN);

      expect(result).toBe("/links/[id]");
    });
  });

  describe("external URLs", () => {
    it("should reduce an external referrer to its origin when it carries a path", () => {
      const raw = "https://www.linkedin.com/in/jane-doe?trk=profile";

      const result = scrubUrl(raw, ORIGIN);

      expect(result).toBe("https://www.linkedin.com");
    });
  });

  describe("non-URL values", () => {
    it("should pass $direct through unchanged when the referrer is direct", () => {
      const result = scrubUrl("$direct", ORIGIN);

      expect(result).toBe("$direct");
    });

    it("should return null when the value is not a URL", () => {
      const result = scrubUrl("not a url at all", ORIGIN);

      expect(result).toBeNull();
    });

    it("should return null when the URL has an opaque origin carrying an address", () => {
      const result = scrubUrl("mailto:jane@example.com", ORIGIN);

      expect(result).toBeNull();
    });
  });
});
