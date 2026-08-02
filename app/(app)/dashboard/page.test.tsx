/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import DashboardPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function setUpDashboard({
  role,
  ghostJobBoard,
}: {
  role: "member" | "admin";
  ghostJobBoard: boolean;
}) {
  const { client } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: { data: { role, display_name: "Test User" }, error: null },
      feature_flags: {
        data: [makeFeatureFlagRow({ key: "ghostJobBoard", enabled: ghostJobBoard })],
        error: null,
      },
      weekly_schedule: { data: [], error: null },
    },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
}

function welcomeBannerProps(
  result: Awaited<ReturnType<typeof DashboardPage>>
): Record<string, unknown> | undefined {
  const children = result.props.children as ReactElement[];
  const banner = children.find(
    (child): child is ReactElement<Record<string, unknown>> => child?.type === WelcomeBanner
  );
  return banner?.props;
}

describe("Dashboard Job Board CTA gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("hides the CTA boolean for a member when ghostJobBoard is off", async () => {
    setUpDashboard({ role: "member", ghostJobBoard: false });

    const result = await DashboardPage();

    expect(welcomeBannerProps(result)?.showJobBoardCta).toBe(false);
  });

  it("shows the CTA boolean for a member when ghostJobBoard is on", async () => {
    setUpDashboard({ role: "member", ghostJobBoard: true });

    const result = await DashboardPage();

    expect(welcomeBannerProps(result)?.showJobBoardCta).toBe(true);
  });

  it("shows the CTA boolean for an admin previewing an off flag", async () => {
    setUpDashboard({ role: "admin", ghostJobBoard: false });

    const result = await DashboardPage();

    expect(welcomeBannerProps(result)?.showJobBoardCta).toBe(true);
  });

  it("passes only a boolean to WelcomeBanner, never a FlagContext or resolver", async () => {
    setUpDashboard({ role: "member", ghostJobBoard: true });

    const result = await DashboardPage();

    expect(typeof welcomeBannerProps(result)?.showJobBoardCta).toBe("boolean");
  });
});
