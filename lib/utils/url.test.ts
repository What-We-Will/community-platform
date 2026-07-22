import { HTTPS_URL_ERROR, isHttpsUrl, validateHttpsUrl } from "./url";

describe("isHttpsUrl", () => {
  describe("accepts well-formed https URLs", () => {
    it("plain https", () => {
      expect(isHttpsUrl("https://example.com")).toBe(true);
    });
    it("https with path, query, and fragment", () => {
      expect(isHttpsUrl("https://sub.example.co.uk/a/b?q=1#x")).toBe(true);
    });
    it("treats the scheme case-insensitively", () => {
      expect(isHttpsUrl("HTTPS://example.com")).toBe(true);
    });
    it("tolerates surrounding whitespace (WHATWG parser trims it)", () => {
      expect(isHttpsUrl("  https://example.com  ")).toBe(true);
    });
  });

  describe("rejects non-https and dangerous schemes", () => {
    it("http (https-only by design)", () => {
      expect(isHttpsUrl("http://example.com")).toBe(false);
    });
    it("javascript:", () => {
      expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    });
    it("data:", () => {
      expect(isHttpsUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });
    it("ftp:", () => {
      expect(isHttpsUrl("ftp://example.com")).toBe(false);
    });
    it("mailto:", () => {
      expect(isHttpsUrl("mailto:a@b.com")).toBe(false);
    });
  });

  describe("rejects unparseable input", () => {
    it("bare host with no scheme", () => {
      expect(isHttpsUrl("example.com")).toBe(false);
    });
    it("scheme-relative reference", () => {
      expect(isHttpsUrl("//example.com")).toBe(false);
    });
    it("garbage", () => {
      expect(isHttpsUrl("not-a-url")).toBe(false);
    });
    it("empty string", () => {
      expect(isHttpsUrl("")).toBe(false);
    });
    it("fails closed on a non-string that slips past the compiler", () => {
      expect(isHttpsUrl(null as unknown as string)).toBe(false);
    });
  });
});

describe("validateHttpsUrl", () => {
  describe("treats absence as acceptable, not invalid", () => {
    it("null", () => {
      expect(validateHttpsUrl(null)).toBeNull();
    });
    it("undefined", () => {
      expect(validateHttpsUrl(undefined)).toBeNull();
    });
    it("empty string — an untouched optional form field", () => {
      expect(validateHttpsUrl("")).toBeNull();
    });
  });

  describe("accepts https links", () => {
    it("returns no error for a well-formed https URL", () => {
      expect(validateHttpsUrl("https://github.com/octocat")).toBeNull();
    });
  });

  describe("rejects everything else with user-facing copy", () => {
    it("http", () => {
      expect(validateHttpsUrl("http://example.com")).toBe(HTTPS_URL_ERROR);
    });
    it("javascript:", () => {
      expect(validateHttpsUrl("javascript:alert(1)")).toBe(HTTPS_URL_ERROR);
    });
    it("malformed", () => {
      expect(validateHttpsUrl("not-a-url")).toBe(HTTPS_URL_ERROR);
    });
    it("whitespace-only is treated as provided-but-invalid, not absent", () => {
      // Distinct from "" — a user typed something, so say why it was rejected.
      expect(validateHttpsUrl("   ")).toBe(HTTPS_URL_ERROR);
    });
  });
});
