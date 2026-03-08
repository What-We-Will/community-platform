import { STATUSES, STATUS_MAP } from "./constants";

describe("STATUSES", () => {
  const REQUIRED_FIELDS = ["value", "label", "color", "bg", "columnBg"] as const;
  const EXPECTED_VALUES = [
    "wishlist",
    "applied",
    "phone_screen",
    "first_interview",
    "second_interview",
    "third_interview",
    "offer",
    "rejected",
  ] as const;

  it("has exactly 8 entries", () => {
    expect(STATUSES).toHaveLength(8);
  });

  it("contains all expected status values in order", () => {
    expect(STATUSES.map((s) => s.value)).toEqual(EXPECTED_VALUES);
  });

  it("starts with 'wishlist'", () => {
    expect(STATUSES[0].value).toBe("wishlist");
  });

  it("ends with 'rejected'", () => {
    expect(STATUSES[STATUSES.length - 1].value).toBe("rejected");
  });

  it.each(EXPECTED_VALUES)("status '%s' has all required fields", (value) => {
    const entry = STATUSES.find((s) => s.value === value);
    expect(entry).toBeDefined();
    for (const field of REQUIRED_FIELDS) {
      expect(entry![field]).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const s of STATUSES) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("each color is a valid Tailwind text-* class", () => {
    for (const s of STATUSES) {
      expect(s.color).toMatch(/^text-/);
    }
  });

  it("each bg contains a Tailwind bg-* class", () => {
    for (const s of STATUSES) {
      expect(s.bg).toMatch(/bg-/);
    }
  });

  it("each columnBg is a valid Tailwind bg-* class", () => {
    for (const s of STATUSES) {
      expect(s.columnBg).toMatch(/^bg-/);
    }
  });

  it("has no duplicate values", () => {
    const values = STATUSES.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("STATUS_MAP", () => {
  it("is an object", () => {
    expect(typeof STATUS_MAP).toBe("object");
    expect(STATUS_MAP).not.toBeNull();
  });

  it("contains an entry for every STATUSES value", () => {
    for (const s of STATUSES) {
      expect(STATUS_MAP[s.value]).toBeDefined();
    }
  });

  it("maps 'withdrawn' to the 'rejected' entry", () => {
    expect(STATUS_MAP["withdrawn"]).toBeDefined();
    expect(STATUS_MAP["withdrawn"].value).toBe("rejected");
  });

  it("maps 'interview' to the 'first_interview' entry", () => {
    expect(STATUS_MAP["interview"]).toBeDefined();
    expect(STATUS_MAP["interview"].value).toBe("first_interview");
  });

  it("maps each canonical status to itself (value identity)", () => {
    for (const s of STATUSES) {
      expect(STATUS_MAP[s.value].value).toBe(s.value);
    }
  });

  it("legacy aliases have all required fields", () => {
    const legacyAliases = ["withdrawn", "interview"];
    const requiredFields = ["value", "label", "color", "bg", "columnBg"];
    for (const alias of legacyAliases) {
      const entry = STATUS_MAP[alias];
      for (const field of requiredFields) {
        expect(entry[field as keyof typeof entry]).toBeTruthy();
      }
    }
  });

  it("returns undefined for an unknown status key", () => {
    expect(STATUS_MAP["nonexistent_status"]).toBeUndefined();
  });
});
