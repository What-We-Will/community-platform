/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import { makeFeatureFlagRow, makePostgrestError } from "@/lib/__tests__/factories";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { createClient } from "@/lib/supabase/server";
import {
  canMutateFeature,
  invalidateFlagSnapshot,
  resetFeatureFlagCacheForTests,
} from "./feature-flags";

const mockCreateClient = vi.mocked(createClient);

/** Holds the first feature_flags read open until release(); `started` resolves once it is in flight. */
function mockGatedFirstRead(...enabledPerRead: boolean[]) {
  const mock = buildMockSupabaseClient({
    tables: {
      feature_flags: enabledPerRead.map((enabled) => ({
        data: [makeFeatureFlagRow({ key: "projects", enabled })],
        error: null,
      })),
    },
  });
  let release!: () => void;
  let markStarted!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const started = new Promise<void>((resolve) => (markStarted = resolve));
  const from = mock.client.from;
  let gated = false;
  mock.client.from = vi.fn((table: string) => {
    const builder = from(table) as Record<string, unknown>;
    if (table === "feature_flags" && !gated) {
      gated = true;
      const settle = builder.then as (resolve: (value: unknown) => unknown) => unknown;
      builder.then = (resolve: (value: unknown) => unknown) => {
        markStarted();
        return gate.then(() => settle(resolve));
      };
    }
    return builder;
  }) as typeof mock.client.from;
  mockCreateClient.mockResolvedValue(mock.client as never);
  return { started, release, queries: mock.queries };
}

describe("invalidating the flag snapshot while reads are in flight or failing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T00:00:00.000Z"));
    resetFeatureFlagCacheForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should re-read the database on the next call when a read that started before invalidation resolves after it", async () => {
    const { started, release, queries } = mockGatedFirstRead(false, true);
    const inFlight = canMutateFeature("projects");
    await started;

    invalidateFlagSnapshot();
    release();
    await inFlight;
    const result = await canMutateFeature("projects");

    expect(result).toBe(true);
    expect(queries.filter(({ table }) => table === "feature_flags")).toHaveLength(2);
  });

  it("should fail closed rather than serve the pre-flip value when the re-read fails", async () => {
    const { client } = buildMockSupabaseClient({
      tables: {
        feature_flags: [
          { data: [makeFeatureFlagRow({ key: "projects", enabled: true })], error: null },
          { data: null, error: makePostgrestError({ code: "PGRST000", message: "connection refused" }) },
        ],
      },
    });
    mockCreateClient.mockResolvedValue(client as never);
    vi.spyOn(console, "info").mockImplementation(() => {});
    await canMutateFeature("projects");

    invalidateFlagSnapshot();
    const result = await canMutateFeature("projects");

    expect(result).toBe(false);
  });
});
