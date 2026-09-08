import { render, screen } from "@testing-library/react";
import { FEATURE_KEYS, type FeatureKey } from "@/lib/feature-keys";
import type { FeatureFlag } from "@/lib/feature-flags";
import AppShell from "./app-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  }),
}));

vi.mock("@/app/(app)/profile/actions", () => ({
  updateLastSeen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/actions/timezone", () => ({
  syncBrowserTimezone: vi.fn().mockResolvedValue(undefined),
}));

const baseUser = {
  id: "user-1",
  email: "member@example.com",
  displayName: "Member One",
  avatarUrl: null,
  unreadCount: 0,
};

const noFlags: Record<FeatureFlag, boolean> = {
  jobApplicationTracker: false,
  learningTracker: false,
  ghostJobBoard: false,
  groupLearning: false,
  projects: false,
};

function renderShell(
  enabledFeatures: FeatureKey[],
  flags: Partial<Record<FeatureFlag, boolean>> = {}
) {
  return render(
    <AppShell
      user={baseUser}
      visibleFlags={{ ...noFlags, ...flags }}
      enabledFeatures={enabledFeatures}
    >
      <div />
    </AppShell>
  );
}

describe("AppShell nav visibility — member feature preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show Events, Groups, and Resource Hub when the member kept the full set", () => {
    renderShell([...FEATURE_KEYS]);

    expect(screen.getByRole("link", { name: /^events$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^groups$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resource hub/i })).toBeInTheDocument();
  });

  it("should hide Events, Groups, and Resource Hub when the member deselected everything", () => {
    renderShell([]);

    expect(screen.queryByRole("link", { name: /^events$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^groups$/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /resource hub/i })
    ).not.toBeInTheDocument();
  });

  it("should keep the Resources header when only WARN Tracker survives both gates", () => {
    renderShell([]);

    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /warn tracker/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /resource hub/i })
    ).not.toBeInTheDocument();
  });

  it("should keep unpreferenced entries visible when the member deselected everything", () => {
    renderShell([]);

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^members$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^messages$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /warn tracker/i })).toBeInTheDocument();
  });
});

// The Ghost Job Board is the one entry governed by both key spaces: the
// platform rollout flag and the member's job_referrals preference.
describe("AppShell nav visibility — Ghost Job Board needs flag and preference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the Job Board when the flag is on and the member opted in", () => {
    renderShell(["job_referrals"], { ghostJobBoard: true });

    expect(screen.getByRole("link", { name: /job board/i })).toBeInTheDocument();
  });

  it("should hide the Job Board when the flag is on but the member opted out", () => {
    renderShell([], { ghostJobBoard: true });

    expect(screen.queryByRole("link", { name: /job board/i })).not.toBeInTheDocument();
  });

  it("should hide the Job Board when the member opted in but the flag is off", () => {
    renderShell(["job_referrals"], { ghostJobBoard: false });

    expect(screen.queryByRole("link", { name: /job board/i })).not.toBeInTheDocument();
  });

  it("should hide the Job Board when the flag is off and the member opted out", () => {
    renderShell([], { ghostJobBoard: false });

    expect(screen.queryByRole("link", { name: /job board/i })).not.toBeInTheDocument();
  });
});
