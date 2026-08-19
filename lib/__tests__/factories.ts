import type { FeatureFlagRow } from "@/lib/feature-flags";
import type { Profile } from "@/lib/types";

type ProfileRoleRow = Pick<Profile, "role">;

export function makeProfileRoleRow(
  overrides: Partial<ProfileRoleRow> = {}
): ProfileRoleRow {
  return { role: "member", ...overrides };
}

export function makeBaseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    display_name: "Jane Doe",
    avatar_url: null,
    resume_path: null,
    headline: null,
    bio: null,
    location: null,
    skills: [],
    open_to_referrals: false,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    timezone: "America/Chicago",
    is_onboarded: true,
    approval_status: "approved",
    role: "member",
    last_seen_at: null,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeFeatureFlagRow(
  overrides: Partial<
    Pick<FeatureFlagRow, "key" | "enabled" | "fail_mode" | "updated_at">
  > = {}
): Pick<FeatureFlagRow, "key" | "enabled" | "fail_mode" | "updated_at"> {
  return {
    key: "jobApplicationTracker",
    enabled: false,
    fail_mode: "closed",
    updated_at: "2026-07-30T00:00:00.000Z",
    ...overrides,
  };
}
