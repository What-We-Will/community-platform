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
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);
const context = { targetingKey: "member-1" };

describe("feature flag fallback logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should log site, stale, and cold error-fallback resolutions when reads change state", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        feature_flags: [
          { data: [makeFeatureFlagRow({ enabled: true })], error: null },
          { data: null, error: { message: "offline" } },
          { data: null, error: { message: "offline" } },
          { data: null, error: { message: "offline" } },
        ],
      },
    });
    mockCreateClient.mockResolvedValue(client as never);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await canMutateFeature("jobApplicationTracker", context);
    vi.advanceTimersByTime(30_001);
    await canMutateFeature("jobApplicationTracker", context);
    resetFeatureFlagCacheForTests();
    await canMutateFeature("jobApplicationTracker", { targetingKey: "" });
    resetFeatureFlagCacheForTests();
    await canMutateFeature("jobApplicationTracker", context);

    expect(log).toHaveBeenNthCalledWith(1, "feature flag resolved", {
      flag: "jobApplicationTracker", source: "site-default", value: true,
    });
    expect(log).toHaveBeenNthCalledWith(2, "feature flag resolved", {
      flag: "jobApplicationTracker", source: "stale-snapshot", value: true,
    });
    expect(log).toHaveBeenNthCalledWith(3, "feature flag resolved", {
      flag: "jobApplicationTracker", source: "error-fallback", value: false,
    });
    expect(log).toHaveBeenNthCalledWith(4, "feature flag resolved", {
      flag: "jobApplicationTracker", source: "error-fallback", value: false,
    });
  });

  it.each([
    ["open", true],
    ["closed", false],
  ] as const)("should use %s when evaluating a known definition fails", async (failMode, expected) => {
    const { client } = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow({ fail_mode: failMode })], error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await expect(canMutateFeature("jobApplicationTracker", { targetingKey: "" })).resolves.toBe(expected);

    expect(log).toHaveBeenCalledWith("feature flag resolved", {
      flag: "jobApplicationTracker", source: "fail-mode", value: expected,
    });
  });

  it("should fail closed without retrying when a read is unauthenticated or permission denied", async () => {
    const unauthenticated = buildMockSupabaseClient({ user: null });
    const denied = buildMockSupabaseClient({
      tables: {
        feature_flags: {
          data: null,
          error: { message: "denied", details: null, hint: null, code: "42501" },
        },
      },
    });
    mockCreateClient.mockResolvedValueOnce(unauthenticated.client as never)
      .mockResolvedValueOnce(denied.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);
    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);

    expect(unauthenticated.queries).toHaveLength(0);
    expect(denied.queries).toHaveLength(1);
  });

  it("should retain a warm snapshot when authentication or RLS fails after refresh", async () => {
    const initial = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow({ enabled: true })], error: null } },
    });
    const unauthenticated = buildMockSupabaseClient({ user: null });
    const fresh = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow({ enabled: true })], error: null } },
    });
    const denied = buildMockSupabaseClient({
      tables: {
        feature_flags: {
          data: null,
          error: { message: "denied", details: null, hint: null, code: "42501" },
        },
      },
    });
    mockCreateClient.mockResolvedValueOnce(initial.client as never)
      .mockResolvedValueOnce(unauthenticated.client as never)
      .mockResolvedValueOnce(fresh.client as never)
      .mockResolvedValueOnce(denied.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
    vi.advanceTimersByTime(30_001);
    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
    resetFeatureFlagCacheForTests();
    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
    vi.advanceTimersByTime(30_001);
    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);

    expect(unauthenticated.queries).toHaveLength(0);
    expect(denied.queries).toHaveLength(1);
  });
});
