/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import {
  canMutateFeature,
  canViewFeature,
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);
const member = { targetingKey: "member-1", attributes: { role: "member" } };
const admin = { targetingKey: "admin-1", attributes: { role: "admin" } };

describe("feature flag authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    [member, true, true],
    [member, false, false],
    [admin, true, true],
    [admin, false, true],
  ] as const)("should resolve view access for %o when the flag is %s", async (context, enabled, expected) => {
    const { client } = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow({ enabled })], error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(canViewFeature("jobApplicationTracker", context)).resolves.toBe(expected);
  });

  it("should never let an admin mutate a disabled feature when attributes claim privilege", async () => {
    const { client } = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow()], error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(canMutateFeature("jobApplicationTracker", {
      targetingKey: "admin-1", attributes: { role: "admin", arbitrary: "true" },
    })).resolves.toBe(false);
  });

  // pgTAP covers the real database RLS boundary.
  it("should not leak an admin view decision when a member resolves next", async () => {
    const { client } = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow()], error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(canViewFeature("jobApplicationTracker", admin)).resolves.toBe(true);
    await expect(canViewFeature("jobApplicationTracker", member)).resolves.toBe(false);
  });
});
