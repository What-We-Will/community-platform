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
  invalidateFlagSnapshot,
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);

function mockFlagReads(...enabledPerRead: boolean[]) {
  const { client, queries } = buildMockSupabaseClient({
    tables: {
      feature_flags: enabledPerRead.map((enabled) => ({
        data: [makeFeatureFlagRow({ key: "projects", enabled })],
        error: null,
      })),
    },
  });
  mockCreateClient.mockResolvedValue(client as never);
  return queries;
}

describe("invalidating the flag snapshot after an admin flip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should serve the cached value when the snapshot has not been invalidated", async () => {
    mockFlagReads(false, true);
    await canMutateFeature("projects");

    vi.advanceTimersByTime(5_000);
    const result = await canMutateFeature("projects");

    expect(result).toBe(false);
  });

  it("should read the new value within the TTL when the snapshot was invalidated", async () => {
    const queries = mockFlagReads(false, true);
    await canMutateFeature("projects");

    invalidateFlagSnapshot();
    vi.advanceTimersByTime(5_000);
    const result = await canMutateFeature("projects");

    expect(result).toBe(true);
    expect(queries.filter(({ table }) => table === "feature_flags")).toHaveLength(2);
  });
});
