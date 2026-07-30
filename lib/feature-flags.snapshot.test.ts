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
  getFlagSnapshot,
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);
const context = { targetingKey: "member-1" };

describe("feature flag snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should accept known rows and ignore unknown future rows when loading a snapshot", async () => {
    const { client, queries } = buildMockSupabaseClient({
      tables: {
        feature_flags: {
          data: [
            makeFeatureFlagRow({ enabled: true }),
            makeFeatureFlagRow({ key: "learningTracker" }),
            makeFeatureFlagRow({ key: "ghostJobBoard" }),
            makeFeatureFlagRow({ key: "futureFlag", enabled: true }),
          ],
          error: null,
        },
      },
    });
    mockCreateClient.mockResolvedValue(client as never);

    const snapshot = await getFlagSnapshot();

    expect(snapshot).toHaveLength(3);
    expect(snapshot.get("jobApplicationTracker")).toMatchObject({ enabled: true });
    expect(queries).toEqual([
      expect.objectContaining({
        table: "feature_flags",
        calls: [{ method: "select", args: ["key, enabled, fail_mode, updated_at"] }],
      }),
    ]);
  });

  it("should preserve the prior snapshot when a known row is malformed", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        feature_flags: [
          { data: [makeFeatureFlagRow({ enabled: true })], error: null },
          {
            data: [
              makeFeatureFlagRow({ key: "learningTracker", enabled: true }),
              makeFeatureFlagRow({
                fail_mode: "not-a-real-mode" as unknown as "open",
              }),
            ],
            error: null,
          },
          { data: null, error: { message: "offline" } },
        ],
      },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
    vi.advanceTimersByTime(30_001);

    await expect(getFlagSnapshot()).rejects.toThrow("Malformed feature flag row");

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(true);
  });

  it("should treat a missing known flag as false when resolving", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        feature_flags: {
          data: [makeFeatureFlagRow({ key: "learningTracker", enabled: true })],
          error: null,
        },
      },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(canMutateFeature("jobApplicationTracker", context)).resolves.toBe(false);
  });

  it("should refresh after the ttl and reset the process snapshot when requested", async () => {
    const { client, queries } = buildMockSupabaseClient({
      tables: { feature_flags: { data: [makeFeatureFlagRow()], error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await canMutateFeature("jobApplicationTracker", context);
    await canMutateFeature("jobApplicationTracker", context);
    vi.advanceTimersByTime(30_001);
    await canMutateFeature("jobApplicationTracker", context);
    resetFeatureFlagCacheForTests();
    await canMutateFeature("jobApplicationTracker", context);

    expect(queries).toHaveLength(3);
  });
});
