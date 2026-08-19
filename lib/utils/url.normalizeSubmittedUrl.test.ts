import { isHttpsUrl, normalizeSubmittedUrl } from "./url";

// The WHATWG URL parser trims surrounding whitespace and removes embedded
// tab/CR/LF before it checks a scheme. Without this normalizer a write path
// would validate one string and persist a different one.
describe("Submitted links are reduced to the exact string that should be stored", () => {
  describe("absence", () => {
    it("should return null when the value is null or undefined", () => {
      expect(normalizeSubmittedUrl(null)).toBeNull();
      expect(normalizeSubmittedUrl(undefined)).toBeNull();
    });

    it("should return null rather than a blank string when the value is empty", () => {
      expect(normalizeSubmittedUrl("")).toBeNull();
    });

    it("should return null when the value is only whitespace the parser ignores", () => {
      expect(normalizeSubmittedUrl("   ")).toBeNull();
      expect(normalizeSubmittedUrl("\t\n\r")).toBeNull();
    });
  });

  describe("whitespace the URL parser silently discards", () => {
    it("should strip surrounding whitespace", () => {
      expect(normalizeSubmittedUrl("  https://example.com  ")).toBe(
        "https://example.com"
      );
    });

    it("should remove an embedded tab", () => {
      expect(normalizeSubmittedUrl("https://exa\tmple.com")).toBe(
        "https://example.com"
      );
    });

    it("should remove an embedded carriage return and line feed", () => {
      expect(normalizeSubmittedUrl("https://exa\r\nmple.com")).toBe(
        "https://example.com"
      );
    });

    it("should leave an already-clean URL untouched", () => {
      expect(normalizeSubmittedUrl("https://github.com/octocat")).toBe(
        "https://github.com/octocat"
      );
    });
  });

  it("should produce a value that validates the same way the raw input did", () => {
    // The whole point: a string the parser accepted must survive normalization
    // still acceptable, so validation and persistence cannot disagree.
    const raw = "  https://git\thub.com/jane  ";

    const normalized = normalizeSubmittedUrl(raw);

    expect(isHttpsUrl(raw)).toBe(true);
    expect(normalized).toBe("https://github.com/jane");
    expect(isHttpsUrl(normalized as string)).toBe(true);
  });
});
