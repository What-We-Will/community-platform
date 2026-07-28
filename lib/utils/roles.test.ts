/**
 * @vitest-environment node
 */
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

  // A repeated `?role=a&role=b` reaches the server as an array and the client as
  // a multi-entry getAll(). Collapsing it to the first value would let the
  // control claim a filter the listing never applied, so both sides reject it.
  it("should return null when the param is repeated", () => {
    const parsed = parseRoleFilter(["member", "admin"]);

    expect(parsed).toBeNull();
  });

  it("should return null when the param is an empty list", () => {
    const parsed = parseRoleFilter([]);

    expect(parsed).toBeNull();
  });

  // getAll() always yields a list, so a single value has to survive it.
  it("should return the role when a single-entry list holds a known role", () => {
    const parsed = parseRoleFilter(["admin"]);

    expect(parsed).toBe("admin");
  });

  it("should return null when a single-entry list holds an unknown role", () => {
    const parsed = parseRoleFilter(["ADMIN"]);

    expect(parsed).toBeNull();
  });
});
