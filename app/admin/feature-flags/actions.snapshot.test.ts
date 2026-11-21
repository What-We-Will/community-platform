/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("server-only", () => ({}));

import {
  makeFeatureFlagRow,
  makeProfileRoleRow,
  makeSetFeatureFlagInput,
} from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import {
  canMutateFeature,
  resetFeatureFlagCacheForTests,
} from "@/lib/feature-flags";
import { setFeatureFlagEnabled } from "./actions";

const UPDATED_AT = "2026-11-20T00:00:00.000Z";

describe("an admin flip is visible on the same server instance straight away", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(UPDATED_AT));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => vi.useRealTimers());

  it("should resolve the new value inside the cache TTL when the flip succeeds", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        profiles: { data: makeProfileRoleRow({ role: "admin" }), error: null },
        feature_flags: [
          { data: [makeFeatureFlagRow({ key: "projects", enabled: false })], error: null },
          { data: [{ key: "projects" }], error: null },
          { data: [makeFeatureFlagRow({ key: "projects", enabled: true })], error: null },
        ],
      },
    });
    createClient.mockResolvedValue(client);
    await canMutateFeature("projects");

    const flip = await setFeatureFlagEnabled(
      makeSetFeatureFlagInput({ expectedUpdatedAt: UPDATED_AT })
    );
    vi.advanceTimersByTime(1_000);
    const afterFlip = await canMutateFeature("projects");

    expect(flip).toEqual({ ok: true });
    expect(afterFlip).toBe(true);
  });
});
