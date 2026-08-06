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
const context = { targetingKey: "user-1" };

describe("feature flag authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should fail closed on view access when authentication is missing or invalid", async () => {
    const unauthenticated = buildMockSupabaseClient({ user: null });
    const invalidCredentials = buildMockSupabaseClient({
      userError: { message: "Authentication credentials are invalid" },
    });
    mockCreateClient.mockResolvedValueOnce(unauthenticated.client as never)
      .mockResolvedValueOnce(invalidCredentials.client as never);

    await expect(canViewFeature("jobApplicationTracker")).resolves.toBe(false);
    await expect(canViewFeature("jobApplicationTracker")).resolves.toBe(false);

    expect(unauthenticated.queries).toHaveLength(0);
    expect(invalidCredentials.queries).toHaveLength(0);
  });

  it("should fail closed without querying flags when authentication is missing or invalid", async () => {
    const unauthenticated = buildMockSupabaseClient({ user: null });
    const invalidCredentials = buildMockSupabaseClient({
      userError: { message: "Authentication credentials are invalid" },
    });
    mockCreateClient.mockResolvedValueOnce(unauthenticated.client as never)
      .mockResolvedValueOnce(invalidCredentials.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);
    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);

    expect(unauthenticated.queries).toHaveLength(0);
    expect(invalidCredentials.queries).toHaveLength(0);
  });

  it("should fail closed when authentication is lost while the process snapshot is fresh", async () => {
    const initial = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow({ enabled: true })], error: null } },
    });
    const unauthenticated = buildMockSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValueOnce(initial.client as never)
      .mockResolvedValueOnce(unauthenticated.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);

    expect(unauthenticated.queries).toHaveLength(0);
  });

  it("should fail closed when authentication is lost after the process snapshot expires", async () => {
    const initial = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow({ enabled: true })], error: null } },
    });
    const unauthenticated = buildMockSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValueOnce(initial.client as never)
      .mockResolvedValueOnce(unauthenticated.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
    vi.advanceTimersByTime(30_001);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);

    expect(unauthenticated.queries).toHaveLength(0);
  });
});
