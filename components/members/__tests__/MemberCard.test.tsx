import { render, screen } from "@testing-library/react";

import MemberCard from "../MemberCard";
import type { Profile, ProfileRole } from "@/lib/types";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile-1",
    display_name: "Alice Doe",
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
    // Old enough that the unrelated "New" badge never renders.
    created_at: "2020-01-01T00:00:00.000Z",
    updated_at: "2020-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const BADGE = /platform admin/i;

describe("Member card platform-role badge", () => {
  it("should show the badge when an admin views a platform admin", () => {
    const profile = makeProfile({ role: "admin" });

    render(<MemberCard profile={profile} viewerIsAdmin />);

    expect(screen.getByText(BADGE)).toBeInTheDocument();
  });

  it("should hide the badge when a non-admin views a platform admin", () => {
    const profile = makeProfile({ role: "admin" });

    render(<MemberCard profile={profile} viewerIsAdmin={false} />);

    expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
  });

  it("should hide the badge when viewerIsAdmin is not supplied at all", () => {
    const profile = makeProfile({ role: "admin" });

    render(<MemberCard profile={profile} />);

    expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
  });

  // 'moderator' is permitted by the profiles CHECK constraint but grants no
  // platform capability, so badging it would advertise authority that does not exist.
  it.each<ProfileRole>(["member", "moderator"])(
    "should hide the badge for a '%s' even when the viewer is an admin",
    (role) => {
      const profile = makeProfile({ role });

      render(<MemberCard profile={profile} viewerIsAdmin />);

      expect(screen.queryByText(BADGE)).not.toBeInTheDocument();
    }
  );

  it("should still render the member's name when the badge is shown", () => {
    const profile = makeProfile({ role: "admin", display_name: "Jane Roe" });

    render(<MemberCard profile={profile} viewerIsAdmin />);

    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
  });
});
