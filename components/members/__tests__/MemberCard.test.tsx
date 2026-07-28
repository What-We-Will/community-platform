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

const ADMIN_BADGE = /platform admin/i;
const MODERATOR_BADGE = /^moderator$/i;

describe("Member card platform-role badge", () => {
  it("should show the platform admin badge for an admin", () => {
    const profile = makeProfile({ role: "admin" });

    render(<MemberCard profile={profile} />);

    expect(screen.getByText(ADMIN_BADGE)).toBeInTheDocument();
  });

  it("should show the moderator badge for a moderator", () => {
    const profile = makeProfile({ role: "moderator" });

    render(<MemberCard profile={profile} />);

    expect(screen.getByText(MODERATOR_BADGE)).toBeInTheDocument();
  });

  it("should show no role badge for a plain member", () => {
    const profile = makeProfile({ role: "member" });

    render(<MemberCard profile={profile} />);

    expect(screen.queryByText(ADMIN_BADGE)).not.toBeInTheDocument();
    expect(screen.queryByText(MODERATOR_BADGE)).not.toBeInTheDocument();
  });

  // The two roles are distinct authorities, so a card never carries both badges.
  it.each<ProfileRole>(["admin", "moderator"])(
    "should show only the '%s' badge and not the other role's",
    (role) => {
      const profile = makeProfile({ role });

      render(<MemberCard profile={profile} />);

      const other = role === "admin" ? MODERATOR_BADGE : ADMIN_BADGE;
      expect(screen.queryByText(other)).not.toBeInTheDocument();
    }
  );

  it("should still render the member's name when a badge is shown", () => {
    const profile = makeProfile({ role: "admin", display_name: "Jane Roe" });

    render(<MemberCard profile={profile} />);

    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
  });
});
