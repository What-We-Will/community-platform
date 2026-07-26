import { PROFILE_ROLES, parseRoleFilter } from "./roles";

describe("Members directory ?role= param narrowing", () => {
  it.each(PROFILE_ROLES)("should return '%s' when the param is that role", (role) => {
    const parsed = parseRoleFilter(role);

    expect(parsed).toBe(role);
  });

  // The param is caller-controlled and its result reaches the profiles query, so
  // anything outside the allowlist has to fall through to "no filter" rather than
  // being passed along. Matching is exact: the app writes these URLs itself, so
  // normalising case would only widen what a hand-typed param can reach.
  it.each([
    "ADMIN",
    "Admin",
    " admin",
    "admin,moderator",
    "true",
    "",
    "*",
    "superuser",
  ])("should return null when the param is '%s'", (value) => {
    const parsed = parseRoleFilter(value);

    expect(parsed).toBeNull();
  });

  it("should return null when the param is absent", () => {
    expect(parseRoleFilter(undefined)).toBeNull();
    expect(parseRoleFilter(null)).toBeNull();
  });
});
