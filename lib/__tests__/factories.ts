import type { ComponentProps } from "react";
import type { AnalyticsBrowserEvent } from "@/lib/analytics/types";
import type { FeatureFlagRow } from "@/lib/feature-flags";
import type {
  ConversationParticipant,
  Event,
  EventRsvp,
  Profile,
} from "@/lib/types";
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

// Rows as the jitsi action's narrow selects return them — only the selected
// columns, Pick-typed against the real domain types so a schema rename breaks
// compilation instead of leaving tests asserting a stale shape.
type ParticipantRow = Pick<ConversationParticipant, "user_id">;
type EventHostRow = Pick<Event, "host_id">;
type EventRsvpRow = Pick<EventRsvp, "status">;

export function makeParticipantRow(
  overrides: Partial<ParticipantRow> = {}
): ParticipantRow {
  return { user_id: "user-1", ...overrides };
}

export function makeEventHostRow(
  overrides: Partial<EventHostRow> = {}
): EventHostRow {
  return { host_id: "host-1", ...overrides };
}

export function makeEventRsvpRow(
  overrides: Partial<EventRsvpRow> = {}
): EventRsvpRow {
  return { status: "going", ...overrides };
}

export function makeCaptureEvent(
  overrides: Partial<AnalyticsBrowserEvent> = {}
): AnalyticsBrowserEvent {
  const { properties, ...rest } = overrides;
  return {
    event: "$pageview",
    properties: {
      $current_url: "https://community.example.org/dashboard",
      $pathname: "/dashboard",
      ...properties,
    },
    ...rest,
  };
}
