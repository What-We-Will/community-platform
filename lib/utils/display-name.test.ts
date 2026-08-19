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
    it("should count one per character when the name is ASCII", () => {
      expect(displayNameLength("Jane Doe")).toBe(8);
    });
    it("should count one when an emoji spans two UTF-16 units", () => {
      // "💩".length === 2 in JS; char_length() in Postgres reports 1.
      expect(displayNameLength("💩")).toBe(1);
      expect("💩".length).toBe(2);
    });
    it("should count every code point when a family emoji is a ZWJ sequence", () => {
      // ZWJ sequence: 4 people + 3 joiners = 7 code points.
      expect(
        displayNameLength("\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}")
      ).toBe(7);
    });
    it("should count one per character when letters carry accents", () => {
      expect(displayNameLength("José")).toBe(4);
    });
  });
});

describe("normalizeDisplayName", () => {
  it("should strip surrounding whitespace when the name is padded", () => {
    expect(normalizeDisplayName("  Jane Doe  ")).toBe("Jane Doe");
  });
  it("should return an empty string when the input is whitespace-only", () => {
    expect(normalizeDisplayName("   ")).toBe("");
  });
  it("should return an empty string when the input is null or undefined", () => {
    expect(normalizeDisplayName(null)).toBe("");
    expect(normalizeDisplayName(undefined)).toBe("");
  });
  it("should leave interior spacing unchanged when trimming the ends", () => {
    expect(normalizeDisplayName("Jane  Q. Doe")).toBe("Jane  Q. Doe");
  });
});

describe("validateDisplayName", () => {
  describe("rejects an absent name", () => {
    it("should return the required error when the name is empty", () => {
      expect(validateDisplayName("")).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    });
    it("should return the required error when the name is whitespace-only", () => {
      expect(validateDisplayName("   ")).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    });
    it("should return the required error when the name is null or undefined", () => {
      expect(validateDisplayName(null)).toBe(DISPLAY_NAME_REQUIRED_ERROR);
      expect(validateDisplayName(undefined)).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    });
  });

  describe("enforces the length boundary", () => {
    it(`should accept the name when it is exactly ${DISPLAY_NAME_MAX_LENGTH} characters`, () => {
      expect(validateDisplayName(atLimit)).toBeNull();
    });
    it(`should reject the name when it is ${DISPLAY_NAME_MAX_LENGTH + 1} characters`, () => {
      expect(validateDisplayName(overLimit)).toBe(DISPLAY_NAME_TOO_LONG_ERROR);
    });
    it("should accept a name at the limit when it is padded with whitespace", () => {
      expect(validateDisplayName(`  ${atLimit}  `)).toBeNull();
    });
    it("should measure code points when the name is emoji, so none are double-counted", () => {
      // 100 emoji are 200 UTF-16 units but 100 code points — must be accepted,
      // matching what the Postgres CHECK constraint will allow.
      expect(validateDisplayName("💩".repeat(DISPLAY_NAME_MAX_LENGTH))).toBeNull();
      expect(
        validateDisplayName("💩".repeat(DISPLAY_NAME_MAX_LENGTH + 1))
      ).toBe(DISPLAY_NAME_TOO_LONG_ERROR);
    });
  });

  it("should return null when the name is ordinary and within the limit", () => {
    expect(validateDisplayName("Jane Doe")).toBeNull();
  });
});
