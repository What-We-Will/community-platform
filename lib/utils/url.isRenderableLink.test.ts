import { isRenderableLink } from "./url";

// The read-time guard behind ADR-0007. Both the admin approvals page and the
// member profile page filter their stored links through this before using one
// as an href, because no database constraint enforces the scheme and rows
// written before validation shipped are still readable.
describe("Stored profile links are only renderable when present and https", () => {
  describe("links that may be rendered", () => {
    it("should accept an https link", () => {
      expect(isRenderableLink({ url: "https://github.com/jane" })).toBe(true);
    });

    it("should accept an https link regardless of scheme casing", () => {
      expect(isRenderableLink({ url: "HTTPS://example.com" })).toBe(true);
    });

    it("should preserve the other fields on the link it accepts", () => {
      const link = { url: "https://jane.dev", label: "Website" };

      const renderable = [link].filter(isRenderableLink);

      expect(renderable).toEqual([link]);
    });
  });

  describe("legacy or hostile values that must never reach an href", () => {
    it.each([
      ["javascript:", "javascript:alert(1)"],
      ["data:", "data:text/html,<script>alert(1)</script>"],
      ["http:", "http://linkedin.com/in/jane"],
      ["ftp:", "ftp://example.com"],
      ["mailto:", "mailto:a@b.com"],
      ["a bare host", "example.com"],
      ["a scheme-relative reference", "//example.com"],
      ["malformed input", "not-a-url"],
      ["whitespace-only", "   "],
      ["an empty string", ""],
    ])("should reject %s", (_label, url) => {
      expect(isRenderableLink({ url })).toBe(false);
    });

    it("should reject an absent link without throwing", () => {
      expect(isRenderableLink({ url: null })).toBe(false);
      expect(isRenderableLink({ url: undefined })).toBe(false);
    });
  });

  it("should drop only the unsafe link when a profile mixes safe and unsafe values", () => {
    const links = [
      { url: "http://linkedin.com/in/jane", label: "LinkedIn" },
      { url: "javascript:alert(1)", label: "GitHub" },
      { url: "https://jane.dev", label: "Website" },
    ];

    const renderable = links.filter(isRenderableLink);

    expect(renderable).toEqual([{ url: "https://jane.dev", label: "Website" }]);
  });

  it("should render nothing when every stored link fails the guard", () => {
    const links = [
      { url: "http://linkedin.com/in/jane", label: "LinkedIn" },
      { url: null, label: "GitHub" },
    ];

    expect(links.filter(isRenderableLink)).toEqual([]);
  });
});
