import { render, screen } from "@testing-library/react";
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
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
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

function allFlags(overrides: Partial<Record<FeatureFlag, boolean>> = {}) {
  return {
    jobApplicationTracker: false,
    learningTracker: false,
    ghostJobBoard: false,
    ...overrides,
  };
}

describe("AppShell nav visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should hide the Job Application Tracker entry for a member when the flag is off", () => {
    render(
      <AppShell user={baseUser} visibleFlags={allFlags({ jobApplicationTracker: false })}>
        <div />
      </AppShell>
    );

    expect(
      screen.queryByRole("link", { name: /job application tracker/i })
    ).not.toBeInTheDocument();
  });

  it("should show the Job Application Tracker entry for a member when the flag is on", () => {
    render(
      <AppShell user={baseUser} visibleFlags={allFlags({ jobApplicationTracker: true })}>
        <div />
      </AppShell>
    );

    expect(
      screen.getByRole("link", { name: /job application tracker/i })
    ).toBeInTheDocument();
  });

  it("should show the Job Application Tracker entry for an admin previewing an off flag", () => {
    // Admin preview is resolved server-side by canViewFeature before AppShell
    // ever sees a boolean — the shell has no separate admin branch.
    render(
      <AppShell
        user={{ ...baseUser, isAdmin: true }}
        visibleFlags={allFlags({ jobApplicationTracker: true })}
      >
        <div />
      </AppShell>
    );

    expect(
      screen.getByRole("link", { name: /job application tracker/i })
    ).toBeInTheDocument();
  });

  it("should keep unflagged nav sections fully visible when every flag is off", () => {
    render(
      <AppShell user={baseUser} visibleFlags={allFlags()}>
        <div />
      </AppShell>
    );

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /job board/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my profile/i })).toBeInTheDocument();
  });

  describe("My Tools section", () => {
    it("should hide the separator, title, and both items when both child flags are off", () => {
      render(
        <AppShell user={baseUser} visibleFlags={allFlags()}>
          <div />
        </AppShell>
      );

      expect(screen.queryByText("My Tools")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /job application tracker/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /learning tracker/i })
      ).not.toBeInTheDocument();
    });

    it("should show only the Job Application Tracker item when just that flag is on", () => {
      render(
        <AppShell
          user={baseUser}
          visibleFlags={allFlags({ jobApplicationTracker: true })}
        >
          <div />
        </AppShell>
      );

      expect(screen.getByText("My Tools")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /job application tracker/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /learning tracker/i })
      ).not.toBeInTheDocument();
    });

    it("should show only the Learning Tracker item when just that flag is on", () => {
      render(
        <AppShell user={baseUser} visibleFlags={allFlags({ learningTracker: true })}>
          <div />
        </AppShell>
      );

      expect(screen.getByText("My Tools")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /learning tracker/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /job application tracker/i })
      ).not.toBeInTheDocument();
    });

    it("should show both items when both child flags are on", () => {
      render(
        <AppShell
          user={baseUser}
          visibleFlags={allFlags({ jobApplicationTracker: true, learningTracker: true })}
        >
          <div />
        </AppShell>
      );

      expect(screen.getByText("My Tools")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /job application tracker/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /learning tracker/i })
      ).toBeInTheDocument();
    });

    it("should show the Learning Tracker item for an admin previewing an off flag", () => {
      render(
        <AppShell
          user={{ ...baseUser, isAdmin: true }}
          visibleFlags={allFlags({ learningTracker: true })}
        >
          <div />
        </AppShell>
      );

      expect(
        screen.getByRole("link", { name: /learning tracker/i })
      ).toBeInTheDocument();
    });
  });
});
