// Mirrors the profiles.role CHECK constraint in
// supabase/migrations/001_profiles.sql — keep the two in step.
export const PROFILE_ROLES = ["member", "admin", "moderator"] as const;

export type ProfileRole = (typeof PROFILE_ROLES)[number];

/** Plural labels for the members-directory role filter. */
export const PROFILE_ROLE_FILTER_LABELS: Record<ProfileRole, string> = {
  member: "Members",
  admin: "Platform Admins",
  moderator: "Moderators",
};

/**
 * Narrows an untrusted `?role=` search param to a known role, or null when the
 * value is unrecognised. Only the allowlisted values reach the profiles query;
 * matching is exact, since the app writes these URLs itself and case-folding
 * would only widen what a hand-typed param can reach.
 */
export function parseRoleFilter(
  value: string | null | undefined
): ProfileRole | null {
  if (!value) return null;
  return (PROFILE_ROLES as readonly string[]).includes(value)
    ? (value as ProfileRole)
    : null;
}
