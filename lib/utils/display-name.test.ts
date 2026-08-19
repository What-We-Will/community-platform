import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_REQUIRED_ERROR,
  DISPLAY_NAME_TOO_LONG_ERROR,
  displayNameLength,
  normalizeDisplayName,
  validateDisplayName,
} from "./display-name";

// The limit is enforced in three places that must agree: both server actions,
// both form inputs, and the Postgres CHECK constraint. These tests pin the
// counting semantics that keep TypeScript and char_length() in agreement.

const atLimit = "a".repeat(DISPLAY_NAME_MAX_LENGTH);
const overLimit = "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1);

describe("displayNameLength", () => {
  describe("counts Unicode code points, matching PostgreSQL char_length", () => {
    it("counts ASCII one per character", () => {
      expect(displayNameLength("Jane Doe")).toBe(8);
    });
    it("counts an astral-plane emoji as one, not two UTF-16 units", () => {
      // "💩".length === 2 in JS; char_length() in Postgres reports 1.
      expect(displayNameLength("💩")).toBe(1);
      expect("💩".length).toBe(2);
    });
    it("counts a family emoji by its code points, as Postgres does", () => {
      // ZWJ sequence: 4 people + 3 joiners = 7 code points.
      expect(displayNameLength("👨‍👩‍👧‍👦")).toBe(7);
    });
    it("counts accented characters as one each", () => {
      expect(displayNameLength("José")).toBe(4);
    });
  });
});

describe("normalizeDisplayName", () => {
  it("strips surrounding whitespace", () => {
    expect(normalizeDisplayName("  Jane Doe  ")).toBe("Jane Doe");
  });
  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeDisplayName("   ")).toBe("");
  });
  it("returns an empty string for null and undefined", () => {
    expect(normalizeDisplayName(null)).toBe("");
    expect(normalizeDisplayName(undefined)).toBe("");
  });
  it("leaves interior spacing alone", () => {
    expect(normalizeDisplayName("Jane  Q. Doe")).toBe("Jane  Q. Doe");
  });
});

describe("validateDisplayName", () => {
  describe("rejects an absent name", () => {
    it("empty string", () => {
      expect(validateDisplayName("")).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    });
    it("whitespace-only", () => {
      expect(validateDisplayName("   ")).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    });
    it("null and undefined", () => {
      expect(validateDisplayName(null)).toBe(DISPLAY_NAME_REQUIRED_ERROR);
      expect(validateDisplayName(undefined)).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    });
  });

  describe("enforces the length boundary", () => {
    it(`accepts exactly ${DISPLAY_NAME_MAX_LENGTH} characters`, () => {
      expect(validateDisplayName(atLimit)).toBeNull();
    });
    it(`rejects ${DISPLAY_NAME_MAX_LENGTH + 1} characters`, () => {
      expect(validateDisplayName(overLimit)).toBe(DISPLAY_NAME_TOO_LONG_ERROR);
    });
    it("measures the trimmed value, so padding does not push a valid name over", () => {
      expect(validateDisplayName(`  ${atLimit}  `)).toBeNull();
    });
    it("measures code points, so emoji are not double-counted against the limit", () => {
      // 100 emoji are 200 UTF-16 units but 100 code points — must be accepted,
      // matching what the Postgres CHECK constraint will allow.
      expect(validateDisplayName("💩".repeat(DISPLAY_NAME_MAX_LENGTH))).toBeNull();
      expect(
        validateDisplayName("💩".repeat(DISPLAY_NAME_MAX_LENGTH + 1))
      ).toBe(DISPLAY_NAME_TOO_LONG_ERROR);
    });
  });

  it("accepts an ordinary name", () => {
    expect(validateDisplayName("Jane Doe")).toBeNull();
  });
});
