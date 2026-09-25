import { render, screen } from "@testing-library/react";
import type { FeatureFlag } from "@/lib/feature-flags";
import { FEATURE_KEYS } from "@/lib/feature-keys";
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

// These cases isolate flag behavior, so every member preference stays on.
const allFeatures = [...FEATURE_KEYS];

function allFlags(overrides: Partial<Record<FeatureFlag, boolean>> = {}) {
  return {
    jobApplicationTracker: false,
    learningTracker: false,
    ghostJobBoard: false,
    groupLearning: false,
    projects: false,
    ...overrides,
  };
}

function countSeparators(container: HTMLElement) {
  return container.querySelectorAll('[data-slot="separator"]').length;
}

describe("AppShell nav visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should hide the Job Application Tracker entry for a member when the flag is off", () => {
    render(
      <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ jobApplicationTracker: false })}>
        <div />
      </AppShell>
    );

    expect(
      screen.queryByRole("link", { name: /job application tracker/i })
    ).not.toBeInTheDocument();
  });

  it("should show the Job Application Tracker entry for a member when the flag is on", () => {
    render(
      <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ jobApplicationTracker: true })}>
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
        enabledFeatures={allFeatures} visibleFlags={allFlags({ jobApplicationTracker: true })}
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
      <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags()}>
        <div />
      </AppShell>
    );

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my profile/i })).toBeInTheDocument();
  });

  describe("Job Board nav entry", () => {
    it("should hide the Job Board entry for a member when ghostJobBoard is off", () => {
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ ghostJobBoard: false })}>
          <div />
        </AppShell>
      );

      expect(screen.queryByRole("link", { name: /job board/i })).not.toBeInTheDocument();
    });

    it("should show the Job Board entry for a member when ghostJobBoard is on", () => {
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ ghostJobBoard: true })}>
          <div />
        </AppShell>
      );

      expect(screen.getByRole("link", { name: /job board/i })).toBeInTheDocument();
    });

    it("should show the Job Board entry for an admin whenever ghostJobBoard resolves true, since AppShell has no separate admin branch", () => {
      // Admin preview is resolved server-side by canViewFeature before AppShell
      // ever sees a boolean (see layout.test.tsx's admin/off coverage) —
      // AppShell itself only ever reads the resolved flags map.
      render(
        <AppShell
          user={{ ...baseUser, isAdmin: true }}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ ghostJobBoard: true })}
        >
          <div />
        </AppShell>
      );

      expect(screen.getByRole("link", { name: /job board/i })).toBeInTheDocument();
    });

    it("should keep the Resources header and its two unflagged siblings visible when every Resources flag is off", () => {
      // WARN Tracker is the only Resources entry carrying no gate at all, so
      // it alone keeps the section from emptying and the header must stay.
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags()}>
          <div />
        </AppShell>
      );

      expect(screen.getByText("Resources")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /resource hub/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /warn tracker/i })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /group learning/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /projects/i })).not.toBeInTheDocument();
    });
  });

  describe("Group Learning nav entry", () => {
    it("should hide the Group Learning entry for a member when groupLearning is off", () => {
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ groupLearning: false })}>
          <div />
        </AppShell>
      );

      expect(screen.queryByRole("link", { name: /group learning/i })).not.toBeInTheDocument();
    });

    it("should show the Group Learning entry for a member when groupLearning is on", () => {
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ groupLearning: true })}>
          <div />
        </AppShell>
      );

      expect(screen.getByRole("link", { name: /group learning/i })).toBeInTheDocument();
    });

    it("should show the Group Learning entry for an admin previewing an off flag", () => {
      render(
        <AppShell
          user={{ ...baseUser, isAdmin: true }}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ groupLearning: true })}
        >
          <div />
        </AppShell>
      );

      expect(screen.getByRole("link", { name: /group learning/i })).toBeInTheDocument();
    });
  });

  describe("Projects nav entry", () => {
    it("should hide the Projects entry for a member when projects is off", () => {
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ projects: false })}>
          <div />
        </AppShell>
      );

      expect(screen.queryByRole("link", { name: /^projects$/i })).not.toBeInTheDocument();
    });

    it("should show the Projects entry for a member when projects is on", () => {
      render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ projects: true })}>
          <div />
        </AppShell>
      );

      expect(screen.getByRole("link", { name: /^projects$/i })).toBeInTheDocument();
    });

    it("should show the Projects entry for an admin previewing an off flag", () => {
      render(
        <AppShell
          user={{ ...baseUser, isAdmin: true }}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ projects: true })}
        >
          <div />
        </AppShell>
      );

      expect(screen.getByRole("link", { name: /^projects$/i })).toBeInTheDocument();
    });
  });

  describe("Resources section visibility", () => {
    it("keeps the header and separator count identical whether some or all Resources items are visible", () => {
      // WARN Tracker carries no gate, so the section never actually empties —
      // this test documents the derivation itself, not a reachable state.
      const { container, rerender } = render(
        <AppShell
          user={baseUser}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ ghostJobBoard: true, groupLearning: false, projects: false })}
        >
          <div />
        </AppShell>
      );

      const separatorCountWithJobsOnly = countSeparators(container);
      expect(screen.getByText("Resources")).toBeInTheDocument();

      rerender(
        <AppShell
          user={baseUser}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ ghostJobBoard: true, groupLearning: true, projects: true })}
        >
          <div />
        </AppShell>
      );

      // Same separator: the section was already visible, adding items to an
      // already-visible section does not add another separator.
      expect(countSeparators(container)).toBe(separatorCountWithJobsOnly);
      expect(screen.getByRole("link", { name: /job board/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /group learning/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /^projects$/i })).toBeInTheDocument();
    });
  });

  describe("My Tools section", () => {
    it("should hide the separator, title, and both items when both child flags are off, and show the separator once a child flag turns on", () => {
      const { container, rerender } = render(
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags()}>
          <div />
        </AppShell>
      );

      const separatorCountWhenOff = countSeparators(container);

      expect(screen.queryByText("My Tools")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /job application tracker/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /learning tracker/i })
      ).not.toBeInTheDocument();

      rerender(
        <AppShell
          user={baseUser}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ jobApplicationTracker: true })}
        >
          <div />
        </AppShell>
      );

      expect(countSeparators(container)).toBe(separatorCountWhenOff + 1);
    });

    it("should show only the Job Application Tracker item when just that flag is on", () => {
      render(
        <AppShell
          user={baseUser}
          enabledFeatures={allFeatures} visibleFlags={allFlags({ jobApplicationTracker: true })}
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
        <AppShell user={baseUser} enabledFeatures={allFeatures} visibleFlags={allFlags({ learningTracker: true })}>
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
          enabledFeatures={allFeatures} visibleFlags={allFlags({ jobApplicationTracker: true, learningTracker: true })}
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
          enabledFeatures={allFeatures} visibleFlags={allFlags({ learningTracker: true })}
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
