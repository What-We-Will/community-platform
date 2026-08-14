import { MAX_SKILL_LENGTH, MAX_SKILLS, validateSkills } from "./skills";

describe("validateSkills", () => {
  it("passes for valid input", () => {
    expect(
      validateSkills(["React", "TypeScript", "Node.js", "CI/CD", " "]),
    ).toEqual({
      valid: true,
      error: null,
    });
  });

  it("rejects a skill over the character limit", () => {
    const oversized = "a".repeat(MAX_SKILL_LENGTH + 1);
    const result = validateSkills([oversized]);

    expect(result.valid).toBe(false);
    expect(result.error).toContain(`${MAX_SKILL_LENGTH}-character limit`);
  });

  it("rejects more than the max number of skills", () => {
    const skills = Array.from(
      { length: MAX_SKILLS + 1 },
      (_, i) => `skill${i}`,
    );
    const result = validateSkills(skills);

    expect(result.valid).toBe(false);
    expect(result.error).toContain(`up to ${MAX_SKILLS} skills`);
  });

  it("reports both violations when a skill is oversized and too many are entered", () => {
    const oversized = "a".repeat(MAX_SKILL_LENGTH + 1);
    const skills = [
      oversized,
      ...Array.from({ length: MAX_SKILLS }, (_, i) => `skill${i}`),
    ];
    const result = validateSkills(skills);

    expect(result.valid).toBe(false);
    expect(result.error).toContain(`${MAX_SKILL_LENGTH}-character limit`);
    expect(result.error).toContain(`up to ${MAX_SKILLS} skills`);
  });
});
