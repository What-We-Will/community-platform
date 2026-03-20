import { getProfileCompleteness } from "./profile-completeness";

describe("getProfileCompleteness", () => {
  it("returns 100 and isStrong when all fields are filled well", () => {
    const r = getProfileCompleteness({
      linkedin_url: "https://linkedin.com/in/me",
      headline: "Engineer",
      bio: "x".repeat(40),
      skills: ["React", "Node"],
      location: "Tulsa, OK",
    });
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
    expect(r.isStrong).toBe(true);
  });

  it("marks isStrong false when score below 80", () => {
    const r = getProfileCompleteness({
      linkedin_url: null,
      headline: "Engineer",
      bio: "x".repeat(40),
      skills: ["React", "Node"],
      location: "Tulsa, OK",
    });
    expect(r.score).toBe(75);
    expect(r.missing).toContain("LinkedIn URL");
    expect(r.isStrong).toBe(false);
  });

  it("requires at least two non-empty skills", () => {
    const r = getProfileCompleteness({
      linkedin_url: "https://linkedin.com/in/me",
      headline: "Engineer",
      bio: "x".repeat(40),
      skills: ["OnlyOne"],
      location: "OK",
    });
    expect(r.missing).toContain("At least 2 skills");
    expect(r.score).toBe(85);
  });

  it("ignores whitespace-only skills", () => {
    const r = getProfileCompleteness({
      linkedin_url: "https://linkedin.com/in/me",
      headline: "Engineer",
      bio: "x".repeat(40),
      skills: ["A", "   ", "B"],
      location: "OK",
    });
    expect(r.missing).not.toContain("At least 2 skills");
  });

  it("gives partial bio credit and flags short bio", () => {
    const r = getProfileCompleteness({
      linkedin_url: "https://linkedin.com/in/me",
      headline: "Engineer",
      bio: "short",
      skills: ["A", "B"],
      location: "OK",
    });
    expect(r.missing).toContain("A longer bio (40+ characters)");
    expect(r.score).toBe(87);
  });

  it("treats empty bio as missing Bio", () => {
    const r = getProfileCompleteness({
      linkedin_url: "https://linkedin.com/in/me",
      headline: "Engineer",
      bio: null,
      skills: ["A", "B"],
      location: "OK",
    });
    expect(r.missing).toContain("Bio");
  });

  it("trims linkedin_url and headline", () => {
    const r = getProfileCompleteness({
      linkedin_url: "  https://linkedin.com/in/me  ",
      headline: "  Title  ",
      bio: "x".repeat(40),
      skills: ["A", "B"],
      location: "OK",
    });
    expect(r.missing).toEqual([]);
    expect(r.isStrong).toBe(true);
  });

  it("accumulates multiple missing fields for sparse profile", () => {
    const r = getProfileCompleteness({
      linkedin_url: null,
      headline: null,
      bio: null,
      skills: [],
      location: null,
    });
    expect(r.score).toBe(0);
    expect(r.missing).toEqual(
      expect.arrayContaining([
        "LinkedIn URL",
        "Headline",
        "Bio",
        "At least 2 skills",
        "Location",
      ])
    );
    expect(r.isStrong).toBe(false);
  });

  it("caps score at 100 if weights overflow", () => {
    const r = getProfileCompleteness({
      linkedin_url: "https://l.com/x",
      headline: "H",
      bio: "x".repeat(100),
      skills: ["a", "b", "c"],
      location: "Here",
    });
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
