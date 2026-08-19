import type { ComponentProps } from "react";
import type { FeatureFlagRow } from "@/lib/feature-flags";
import type { Profile } from "@/lib/types";
import type { completeOnboarding } from "@/app/onboarding/actions";
import type OnboardingForm from "@/app/onboarding/onboarding-form";

// Derived from the action's own parameter type rather than restated, so a change
// to what onboarding accepts breaks this at compile time instead of leaving the
// tests asserting against a shape the server no longer takes.
type OnboardingInput = Parameters<typeof completeOnboarding>[0];

export function makeOnboardingInput(
  overrides: Partial<OnboardingInput> = {}
): OnboardingInput {
  return {
    display_name: "Jane Doe",
    skills: ["TypeScript"],
    open_to_referrals: true,
    ...overrides,
  };
}

// Derived from the component's own prop type for the same reason as above.
type OnboardingInitialData = ComponentProps<typeof OnboardingForm>["initialData"];

export function makeOnboardingInitialData(
  overrides: Partial<OnboardingInitialData> = {}
): OnboardingInitialData {
  return {
    display_name: "Jane Doe",
    headline: "",
    location: "",
    bio: "",
    skills: [],
    open_to_referrals: false,
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    ...overrides,
  };
}

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
