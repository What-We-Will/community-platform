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
  FLAG_KEYS,
  canMutateFeature,
  getFlagSnapshot,
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);

function rowWithout(field: string) {
  const row = makeFeatureFlagRow() as Record<string, unknown>;
  delete row[field];
  return row;
}

describe("feature flag row validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it.each([
    ["a non-array response", { key: "jobApplicationTracker" }],
    ["an invalid enabled value", [{ ...makeFeatureFlagRow(), enabled: "true" }]],
    ["a missing enabled value", [rowWithout("enabled")]],
    ["an invalid fail mode", [{ ...makeFeatureFlagRow(), fail_mode: "unknown" }]],
    ["an invalid updated timestamp", [{ ...makeFeatureFlagRow(), updated_at: "not-a-date" }]],
    ["a missing updated timestamp", [rowWithout("updated_at")]],
    [
      "a duplicate known key",
      [makeFeatureFlagRow(), makeFeatureFlagRow({ enabled: true })],
    ],
  ])("should reject a refresh when it receives %s", async (_scenario, data) => {
    const { client } = buildMockSupabaseClient({
      tables: { feature_flags: { data, error: null } },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(getFlagSnapshot()).rejects.toThrow();
  });

  it.each(FLAG_KEYS)("should fail closed when %s has no cold snapshot", async (flag) => {
    const { client, queries } = buildMockSupabaseClient({
      tables: { feature_flags: { data: null, error: { message: "offline" } } },
    });
    mockCreateClient.mockResolvedValue(client as never);

    await expect(canMutateFeature(flag, { targetingKey: "user-1" })).resolves.toBe(false);

    expect(queries).toHaveLength(1);
  });
});
