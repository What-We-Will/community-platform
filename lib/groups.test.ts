import { normalizeSlug } from "./groups";

// ── normalizeSlug ─────────────────────────────────────────────────────────────

describe("normalizeSlug", () => {
  // Valid inputs
  it("lowercases the input", () => {
    expect(normalizeSlug("Hello")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(normalizeSlug("hello world")).toBe("hello-world");
  });

  it("replaces multiple spaces with a single hyphen", () => {
    expect(normalizeSlug("hello   world")).toBe("hello-world");
  });

  it("collapses consecutive hyphens into one", () => {
    expect(normalizeSlug("hello--world")).toBe("hello-world");
  });

  it("strips leading hyphens", () => {
    expect(normalizeSlug("-hello")).toBe("hello");
  });

  it("strips trailing hyphens", () => {
    expect(normalizeSlug("hello-")).toBe("hello");
  });

  it("strips special characters", () => {
    expect(normalizeSlug("hello!@#world")).toBe("helloworld");
  });

  it("allows digits", () => {
    expect(normalizeSlug("group123")).toBe("group123");
  });

  it("handles a string that is only digits", () => {
    expect(normalizeSlug("123")).toBe("123");
  });

  it("preserves an already valid slug", () => {
    expect(normalizeSlug("my-group")).toBe("my-group");
  });

  it("trims surrounding whitespace before slugifying", () => {
    expect(normalizeSlug("  hello  ")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(70);
    const result = normalizeSlug(long);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(60);
  });

  it("truncated result must still be a valid slug (no trailing hyphen)", () => {
    // 58 a's + " b" → after truncation the hyphen might end up at position 59
    const edgeCase = "a".repeat(58) + " b";
    const result = normalizeSlug(edgeCase);
    if (result !== null) {
      expect(result).not.toMatch(/^-|-$/);
    }
  });

  // Null / empty inputs
  it("returns null for an empty string", () => {
    expect(normalizeSlug("")).toBeNull();
  });

  it("returns null for a string of only spaces", () => {
    expect(normalizeSlug("   ")).toBeNull();
  });

  it("returns null for a string of only special characters", () => {
    expect(normalizeSlug("!@#$%^&*()")).toBeNull();
  });

  it("returns null for a string of only hyphens", () => {
    expect(normalizeSlug("---")).toBeNull();
  });

  // Unicode / non-ASCII
  it("strips accented characters (not in [a-z0-9])", () => {
    const result = normalizeSlug("café");
    // "café" → "caf" (é stripped) — valid
    expect(result).toBe("caf");
  });

  it("handles mixed valid and invalid characters", () => {
    expect(normalizeSlug("AI & ML Group!")).toBe("ai-ml-group");
  });

  it("is deterministic — same input always gives same output", () => {
    expect(normalizeSlug("Test Group")).toBe(normalizeSlug("Test Group"));
  });
});
