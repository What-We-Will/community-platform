/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import AppShell from "./app-shell";
import AppLayout from "./layout";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

/** Wires an onboarded profile and a single off/on feature flag row. */
function setUpLayout({
  role,
  enabled,
}: {
  role: "member" | "admin";
  enabled: boolean;
}) {
  const { client } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: {
        data: {
          display_name: "Test User",
          avatar_url: null,
          is_onboarded: true,
          role,
        },
        error: null,
      },
      feature_flags: {
        data: [makeFeatureFlagRow({ key: "jobApplicationTracker", enabled })],
        error: null,
      },
    },
  });
  // buildMockSupabaseClient models the PostgREST query builder only;
  // layout.tsx separately calls the `rpc()` boundary for the unread count.
  (client as unknown as { rpc: unknown }).rpc = vi
    .fn()
    .mockResolvedValue({ data: 0, error: null });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
}

describe("AppLayout flag wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should resolve jobApplicationTracker visible for an admin previewing an off flag", async () => {
    setUpLayout({ role: "admin", enabled: false });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.jobApplicationTracker).toBe(true);
  });

  it("should resolve jobApplicationTracker hidden for a member when the flag is off", async () => {
    setUpLayout({ role: "member", enabled: false });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.jobApplicationTracker).toBe(false);
  });
});
