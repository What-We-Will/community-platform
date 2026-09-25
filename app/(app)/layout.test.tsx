/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests, type FeatureFlag } from "@/lib/feature-flags";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import AppShell from "./app-shell";
import AppLayout from "./layout";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

/** Wires an onboarded profile and a single off/on feature flag row. */
function setUpLayout({
  role,
  enabled,
  flag = "jobApplicationTracker",
}: {
  role: "member" | "admin";
  enabled: boolean;
  flag?: FeatureFlag;
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
          enabled_features: [...FEATURE_KEYS],
        },
        error: null,
      },
      feature_flags: {
        data: [makeFeatureFlagRow({ key: flag, enabled })],
        error: null,
      },
    },
    rpc: {
      get_total_unread_count: { data: 0, error: null },
    },
  });
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

  it("should resolve ghostJobBoard visible for an admin previewing an off flag", async () => {
    setUpLayout({ role: "admin", enabled: false, flag: "ghostJobBoard" });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.ghostJobBoard).toBe(true);
  });

  it("should resolve ghostJobBoard hidden for a member when the flag is off", async () => {
    setUpLayout({ role: "member", enabled: false, flag: "ghostJobBoard" });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.ghostJobBoard).toBe(false);
  });

  it("should resolve groupLearning visible for an admin previewing an off flag", async () => {
    setUpLayout({ role: "admin", enabled: false, flag: "groupLearning" });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.groupLearning).toBe(true);
  });

  it("should resolve groupLearning hidden for a member when the flag is off", async () => {
    setUpLayout({ role: "member", enabled: false, flag: "groupLearning" });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.groupLearning).toBe(false);
  });

  it("should resolve projects visible for an admin previewing an off flag", async () => {
    setUpLayout({ role: "admin", enabled: false, flag: "projects" });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.projects).toBe(true);
  });

  it("should resolve projects hidden for a member when the flag is off", async () => {
    setUpLayout({ role: "member", enabled: false, flag: "projects" });

    const result = await AppLayout({ children: <div /> });

    expect(result.type).toBe(AppShell);
    expect(result.props.visibleFlags.projects).toBe(false);
  });
});
