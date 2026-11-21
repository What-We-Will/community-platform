import { render, screen } from "@testing-library/react";
import { makeAppShellUser, makeVisibleFlags } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import { createClient } from "@/lib/supabase/client";
import AppShell from "./app-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

vi.mock("@/app/(app)/profile/actions", () => ({
  updateLastSeen: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/actions/timezone", () => ({
  syncBrowserTimezone: vi.fn().mockResolvedValue(undefined),
}));

function renderShell(isAdmin: boolean) {
  render(
    <AppShell
      user={makeAppShellUser({ isAdmin })}
      enabledFeatures={[...FEATURE_KEYS]}
      visibleFlags={makeVisibleFlags()}
    >
      <div />
    </AppShell>
  );
}

describe("AppShell admin nav — feature flags entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { client } = buildMockSupabaseClient({
      rpc: { get_total_unread_count: { data: 0, error: null } },
    });
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>
    );
  });

  it("should link admins to the feature flags page when the viewer is an admin", () => {
    renderShell(true);

    expect(screen.getByRole("link", { name: /^feature flags$/i })).toHaveAttribute(
      "href",
      "/admin/feature-flags"
    );
  });

  it("should hide the feature flags entry when the viewer is a member", () => {
    renderShell(false);

    expect(screen.queryByRole("link", { name: /^feature flags$/i })).toBeNull();
  });
});
