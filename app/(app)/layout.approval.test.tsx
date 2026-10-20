/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import type { Profile } from "@/lib/types";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import AppLayout from "./layout";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function setUpMember(
  profile: Partial<Profile> | null,
  user: { id: string } | null = { id: "user-1" }
) {
  const { client } = buildMockSupabaseClient({
    user,
    tables: {
      profiles: { data: profile ? makeBaseProfile(profile) : null, error: null },
      feature_flags: { data: [], error: null },
    },
    rpc: { get_total_unread_count: { data: 0, error: null } },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
}

describe("AppLayout keeps unapproved members out of the app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should redirect to /pending-approval when the member is onboarded but pending", async () => {
    setUpMember({ approval_status: "pending" });

    const render = AppLayout({ children: <div /> });

    await expect(render).rejects.toThrow("NEXT_REDIRECT:/pending-approval");
  });

  it("should redirect to /pending-approval when the member is onboarded but rejected", async () => {
    setUpMember({ approval_status: "rejected" });

    const render = AppLayout({ children: <div /> });

    await expect(render).rejects.toThrow("NEXT_REDIRECT:/pending-approval");
  });

  it("should redirect to /pending-approval when the approval status is outside the known set", async () => {
    setUpMember({ approval_status: "APPROVED" as Profile["approval_status"] });

    const render = AppLayout({ children: <div /> });

    await expect(render).rejects.toThrow("NEXT_REDIRECT:/pending-approval");
  });

  it("should redirect to /onboarding before checking approval when the member is not onboarded", async () => {
    setUpMember({ is_onboarded: false, approval_status: "pending" });

    const render = AppLayout({ children: <div /> });

    await expect(render).rejects.toThrow("NEXT_REDIRECT:/onboarding");
  });

  it("should redirect to /onboarding when the profile row is missing", async () => {
    setUpMember(null);

    const render = AppLayout({ children: <div /> });

    await expect(render).rejects.toThrow("NEXT_REDIRECT:/onboarding");
  });

  it("should redirect to /login when there is no signed-in user", async () => {
    setUpMember(null, null);

    const render = AppLayout({ children: <div /> });

    await expect(render).rejects.toThrow("NEXT_REDIRECT:/login");
  });
});
