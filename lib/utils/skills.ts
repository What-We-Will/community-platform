export const MAX_SKILL_LENGTH = 30;
export const MAX_SKILLS = 20;

type SkillsValidationResult =
  | { valid: true; error: null }
  | { valid: false; error: string };

export function validateSkills(skills: string[]): SkillsValidationResult {
  const errors: string[] = [];

  const oversizedSkills = skills.filter((s) => s.length > MAX_SKILL_LENGTH);
  if (oversizedSkills.length > 0) {
    errors.push(
      `Skill${oversizedSkills.length > 1 ? "s" : ""} ${oversizedSkills
        .map((s) => `"${s}"`)
        .join(", ")} ${
        oversizedSkills.length > 1 ? "exceed" : "exceeds"
      } the ${MAX_SKILL_LENGTH}-character limit.`,
    );
  }

  if (skills.length > MAX_SKILLS) {
    errors.push(
      `You can add up to ${MAX_SKILLS} skills (you entered ${skills.length}).`,
    );
  }

  return errors.length > 0
    ? { valid: false, error: errors.join(" ") }
    : { valid: true, error: null };
}
