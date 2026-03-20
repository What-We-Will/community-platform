import {
  DEFAULT_CAREER_BRIEF_OPTIONS,
  buildWhatWeWillBriefRequest,
  buildWhatWeWillProfilePayload,
} from "./profile-payload";

describe("buildWhatWeWillProfilePayload", () => {
  const base = {
    id: "user-1",
    headline: null,
    bio: null,
    skills: null,
    linkedin_url: null,
    location: null,
  };

  it("maps profile row to Pulsar profile request", () => {
    const p = buildWhatWeWillProfilePayload({
      ...base,
      headline: "Engineer | Manager",
      bio: "Builder",
      skills: ["TS", "React"],
      linkedin_url: "https://linkedin.com/in/x",
      location: "Remote",
    });
    expect(p.personId).toBe("user-1");
    expect(p.linkedinUrl).toBe("https://linkedin.com/in/x");
    expect(p.experienceSummary).toBe("Builder");
    expect(p.skills).toEqual(["TS", "React"]);
    expect(p.interestedRoleTitles).toEqual(["Engineer", "Manager"]);
    expect(p.preferredWorkTypes).toEqual(["remote", "hybrid"]);
    expect(p.preferredLocations).toEqual(["Remote"]);
    expect(p.interestedIndustries).toEqual([]);
  });

  it("splits headline on comma and pipe and caps at 3 titles", () => {
    const p = buildWhatWeWillProfilePayload({
      ...base,
      headline: "A, B, C, D",
    });
    expect(p.interestedRoleTitles).toEqual(["A", "B", "C"]);
  });

  it("omits optional fields when empty", () => {
    const p = buildWhatWeWillProfilePayload(base);
    expect(p.linkedinUrl).toBeUndefined();
    expect(p.experienceSummary).toBeUndefined();
    expect(p.skills).toEqual([]);
    expect(p.preferredLocations).toEqual([]);
    expect(p.interestedRoleTitles).toEqual([]);
  });
});

describe("buildWhatWeWillBriefRequest", () => {
  it("extends profile payload with default career brief options", () => {
    const row = {
      id: "u1",
      headline: "Dev",
      bio: "Bio text here for testing purposes ok",
      skills: ["a", "b"],
      linkedin_url: "https://l.com/x",
      location: "NYC",
    };
    const b = buildWhatWeWillBriefRequest(row);
    expect(b.tone).toBe(DEFAULT_CAREER_BRIEF_OPTIONS.tone);
    expect(b.maxWords).toBe(DEFAULT_CAREER_BRIEF_OPTIONS.maxWords);
    expect(b.includeIllustrativeLinks).toBe(
      DEFAULT_CAREER_BRIEF_OPTIONS.includeIllustrativeLinks
    );
    expect(b.personId).toBe("u1");
    expect(b.interestedRoleTitles).toEqual(["Dev"]);
  });
});
