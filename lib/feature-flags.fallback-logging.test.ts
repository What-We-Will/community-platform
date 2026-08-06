/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import { canMutateFeature, resetFeatureFlagCacheForTests } from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);
const context = { targetingKey: "user-1" };
const syntheticEvaluatorFailureContext = { targetingKey: "" };

describe("feature flag fallback logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should not log the site-default happy path, but should log stale and cold error-fallback resolutions with the causing error", async () => {
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
    await canMutateFeature("jobApplicationTracker", context);
    resetFeatureFlagCacheForTests();
    await canMutateFeature("jobApplicationTracker", context);

    expect(log).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenNthCalledWith(1, "feature flag resolved", {
      flag: "jobApplicationTracker",
      source: "stale-snapshot",
      value: true,
      error: expect.objectContaining({
        message: "Feature flag read failed: offline",
      }),
    });
    expect(log).toHaveBeenNthCalledWith(2, "feature flag resolved", {
      flag: "jobApplicationTracker",
      source: "error-fallback",
      value: false,
      error: expect.objectContaining({
        message: "Feature flag read failed: offline",
      }),
    });
    expect(log).toHaveBeenNthCalledWith(3, "feature flag resolved", {
      flag: "jobApplicationTracker",
      source: "error-fallback",
      value: false,
      error: expect.objectContaining({
        message: "Feature flag read failed: offline",
      }),
    });
  });

  it("should not log a site-default resolution", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        feature_flags: { data: [makeFeatureFlagRow({ enabled: true })], error: null },
      },
    });
    mockCreateClient.mockResolvedValue(client as never);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);

    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    ["open", true],
    ["closed", false],
  ] as const)("should preserve %s fail mode when a synthetic evaluator failure occurs", async (failMode, expected) => {
    const { client } = buildMockSupabaseClient({
      user: { id: syntheticEvaluatorFailureContext.targetingKey },
      tables: { feature_flags: { data: [makeFeatureFlagRow({ fail_mode: failMode })], error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await expect(canMutateFeature("jobApplicationTracker", syntheticEvaluatorFailureContext)).resolves.toBe(expected);

    expect(log).toHaveBeenCalledWith("feature flag resolved", {
      flag: "jobApplicationTracker",
      source: "fail-mode",
      value: expected,
      error: expect.objectContaining({
        message: "Feature flag context requires a targeting key",
      }),
    });
  });

  it("should fail closed without retrying when a feature flag read is permission denied", async () => {
    const denied = buildMockSupabaseClient({
      tables: {
        feature_flags: {
          data: null,
          error: { message: "denied", details: null, hint: null, code: "42501" },
        },
      },
    });
    mockCreateClient.mockResolvedValue(denied.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);

    expect(denied.queries).toHaveLength(1);
  });

  it("should retain a warm snapshot when RLS fails after refresh", async () => {
    const initial = buildMockSupabaseClient({
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
      .mockResolvedValueOnce(denied.client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
    vi.advanceTimersByTime(30_001);
    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);

    expect(denied.queries).toHaveLength(1);
  });
});
