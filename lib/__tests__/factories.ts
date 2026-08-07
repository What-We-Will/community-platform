import type { FeatureFlagRow } from "@/lib/feature-flags";
import type { Profile } from "@/lib/types";

type ProfileRoleRow = Pick<Profile, "role">;

export function makeProfileRoleRow(
  overrides: Partial<ProfileRoleRow> = {}
): ProfileRoleRow {
  return { role: "member", ...overrides };
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
