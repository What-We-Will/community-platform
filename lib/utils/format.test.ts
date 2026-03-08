import { formatTimeLabel, countWeekdays } from "./format";

// ── formatTimeLabel ───────────────────────────────────────────────────────────

describe("formatTimeLabel", () => {
  describe("AM times", () => {
    it("formats midnight as 12:00 AM", () => {
      expect(formatTimeLabel("00:00")).toBe("12:00 AM");
    });

    it("formats 00:30 as 12:30 AM", () => {
      expect(formatTimeLabel("00:30")).toBe("12:30 AM");
    });

    it("formats 06:00 as 6:00 AM", () => {
      expect(formatTimeLabel("06:00")).toBe("6:00 AM");
    });

    it("formats 06:30 as 6:30 AM", () => {
      expect(formatTimeLabel("06:30")).toBe("6:30 AM");
    });

    it("formats 09:00 as 9:00 AM", () => {
      expect(formatTimeLabel("09:00")).toBe("9:00 AM");
    });

    it("formats 11:30 as 11:30 AM", () => {
      expect(formatTimeLabel("11:30")).toBe("11:30 AM");
    });
  });

  describe("PM times", () => {
    it("formats noon as 12:00 PM", () => {
      expect(formatTimeLabel("12:00")).toBe("12:00 PM");
    });

    it("formats 12:30 as 12:30 PM", () => {
      expect(formatTimeLabel("12:30")).toBe("12:30 PM");
    });

    it("formats 13:00 as 1:00 PM", () => {
      expect(formatTimeLabel("13:00")).toBe("1:00 PM");
    });

    it("formats 14:30 as 2:30 PM", () => {
      expect(formatTimeLabel("14:30")).toBe("2:30 PM");
    });

    it("formats 18:00 as 6:00 PM", () => {
      expect(formatTimeLabel("18:00")).toBe("6:00 PM");
    });

    it("formats 23:00 as 11:00 PM", () => {
      expect(formatTimeLabel("23:00")).toBe("11:00 PM");
    });

    it("formats 23:30 as 11:30 PM", () => {
      expect(formatTimeLabel("23:30")).toBe("11:30 PM");
    });
  });

  it("zero-pads minutes correctly", () => {
    expect(formatTimeLabel("09:00")).toBe("9:00 AM");
    expect(formatTimeLabel("14:00")).toBe("2:00 PM");
  });

  it("does not zero-pad hours", () => {
    expect(formatTimeLabel("06:00")).toBe("6:00 AM");
  });
});

// ── countWeekdays ─────────────────────────────────────────────────────────────

describe("countWeekdays", () => {
  it("returns 0 when start and end are the same date (exclusive start)", () => {
    expect(countWeekdays("2026-03-09", "2026-03-09")).toBe(0);
  });

  it("returns 0 when the only days between are weekend days", () => {
    // Friday 2026-03-06 → end Saturday 2026-03-07 (only Saturday between)
    expect(countWeekdays("2026-03-06", "2026-03-07")).toBe(0);
  });

  it("returns 0 for a full Saturday–Sunday range", () => {
    expect(countWeekdays("2026-03-07", "2026-03-08")).toBe(0);
  });

  it("counts 1 weekday for Monday as the only day after start", () => {
    // Sunday start, Monday end
    expect(countWeekdays("2026-03-08", "2026-03-09")).toBe(1);
  });

  it("counts 5 weekdays in a Mon–Fri window (exclusive Monday start)", () => {
    // Mon 2026-03-09 → Fri 2026-03-13 = Tue, Wed, Thu, Fri (from start)? No:
    // exclusive start = Tue, Wed, Thu, Fri, Sat(skip) = 4 actually
    // Let me pick: Sun start → Fri end = Mon Tue Wed Thu Fri = 5
    expect(countWeekdays("2026-03-08", "2026-03-13")).toBe(5);
  });

  it("counts 5 weekdays in a full calendar week (exclusive Sunday, inclusive Saturday)", () => {
    // 2026-03-08 (Sun) → 2026-03-14 (Sat): Mon–Fri = 5, Saturday excluded
    expect(countWeekdays("2026-03-08", "2026-03-14")).toBe(5);
  });

  it("counts 10 weekdays across two full weeks", () => {
    // 2026-03-08 (Sun) → 2026-03-21 (Sat): 2 × Mon–Fri = 10
    expect(countWeekdays("2026-03-08", "2026-03-21")).toBe(10);
  });

  it("skips weekend days within a range spanning multiple weeks", () => {
    // 2026-03-06 (Fri) → 2026-03-16 (Mon): Sat+Sun skip, Mon-Fri next week = 5, then Mon = 6
    expect(countWeekdays("2026-03-06", "2026-03-16")).toBe(6);
  });

  it("counts correctly when start is a Friday", () => {
    // Friday 2026-03-13 → Monday 2026-03-16: Sat, Sun skipped, Mon = 1
    expect(countWeekdays("2026-03-13", "2026-03-16")).toBe(1);
  });

  it("returns 0 for an inverted range (end before start)", () => {
    expect(countWeekdays("2026-03-20", "2026-03-10")).toBe(0);
  });
});
