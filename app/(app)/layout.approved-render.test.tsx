/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));
vi.mock("@/app/(app)/profile/actions", () => ({
  updateLastSeen: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/actions/timezone", () => ({
  syncBrowserTimezone: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("posthog-js", () => ({
  default: {
    __loaded: true,
    identify: vi.fn(),
    reset: vi.fn(),
    get_distinct_id: vi.fn(),
    get_property: vi.fn(),
  },
}));

import { renderToStaticMarkup } from "react-dom/server";
import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import AppLayout from "./layout";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

describe("AppLayout lets approved members into the app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should show the page content and app navigation when the member is onboarded and approved", async () => {
    const { client } = buildMockSupabaseClient({
      user: { id: "user-1" },
      tables: {
        profiles: { data: makeBaseProfile({ display_name: "Member One" }), error: null },
        feature_flags: { data: [], error: null },
      },
      rpc: { get_total_unread_count: { data: 0, error: null } },
    });
    mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);

    const html = renderToStaticMarkup(
      await AppLayout({ children: <p>Member page content</p> })
    );

    expect(html).toContain("<p>Member page content</p>");
    expect(html).toContain('href="/dashboard"');
  });
});
