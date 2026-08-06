/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({
  // This wiring test simulates only same-request promise reuse, not React request scope or invalidation.
  cache: <T extends (...args: never[]) => Promise<unknown>>(fn: T) => {
    let promise: Promise<unknown> | undefined;
    return (...args: Parameters<T>) => (promise ??= fn(...args));
  },
}));

import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import {
  canViewFeature,
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);

describe("feature flag request memoization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should issue one server-profile and cold-snapshot query when view resolutions are concurrent", async () => {
    const { client, queries } = buildMockSupabaseClient({
      tables: {
        feature_flags: { data: [makeFeatureFlagRow({ enabled: true })], error: null },
        profiles: { data: { role: "member" }, error: null },
      },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(Promise.all([
      canViewFeature("jobApplicationTracker"),
      canViewFeature("learningTracker"),
    ])).resolves.toEqual([true, false]);

    expect(queries.filter(({ table }) => table === "profiles")).toHaveLength(1);
    expect(queries.filter(({ table }) => table === "feature_flags")).toHaveLength(1);
  });
});
