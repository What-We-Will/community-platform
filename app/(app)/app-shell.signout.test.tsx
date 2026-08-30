import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import posthog from "posthog-js";
import type { FeatureFlag } from "@/lib/feature-flags";
import AppShell from "./app-shell";

const { push, refresh, signOut } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => "/dashboard",
}));

vi.mock("posthog-js", () => ({
  default: { __loaded: true, reset: vi.fn() },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signOut },
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })),
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

const noFlags = {
  jobApplicationTracker: false,
  learningTracker: false,
  ghostJobBoard: false,
  groupLearning: false,
  projects: false,
} satisfies Record<FeatureFlag, boolean>;

describe("AppShell sign out — uses the shared sign-out helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "profile_onboarded=1; path=/";
    document.cookie = "profile_approved=1; path=/";
  });

  it("should sign out, clear both cookies, and reset analytics identity when Sign out is clicked", async () => {
    render(
      <AppShell user={baseUser} visibleFlags={noFlags}>
        <div />
      </AppShell>
    );

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(signOut).toHaveBeenCalled();
    expect(document.cookie).not.toContain("profile_onboarded");
    expect(document.cookie).not.toContain("profile_approved");
    expect(posthog.reset).toHaveBeenCalledWith(true);
    expect(refresh).toHaveBeenCalled();
  });
});
