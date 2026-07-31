/**
 * @vitest-environment node
 *
 * Proves the mutation gate wires through the REAL feature-flag resolver rather
 * than only a mocked canMutateFeature. actions.test.ts mocks @/lib/feature-flags
 * entirely for its per-action matrix; this file leaves it unmocked and drives
 * resolution through a mocked supabase feature_flags table instead, so the
 * canMutateFeature("jobApplicationTracker", ...) call site is exercised for real.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { createApplication } from "./actions";

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function makeChain(thenResult: Record<string, any> = { error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

/** Dispatches from() by table: feature_flags serves the resolver's own read,
 * any other table serves the action's own mutation. */
function clientWithFlag(enabled: boolean) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    from: vi.fn((table: string) => {
      if (table === "feature_flags") {
        return makeChain({
          data: [makeFeatureFlagRow({ key: "jobApplicationTracker", enabled })],
          error: null,
        });
      }
      return makeChain({ error: null });
    }),
  } as any;
}

describe("createApplication — real feature-flag resolver wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("denies the mutation when the real resolver reports the flag off", async () => {
    mockCreateClient.mockResolvedValue(clientWithFlag(false));

    const result = await createApplication({ company: "ACME", position: "Engineer", status: "applied" });

    expect(result).toEqual({ error: "Feature not available" });
  });

  it("reaches the existing insert behavior when the real resolver reports the flag on", async () => {
    mockCreateClient.mockResolvedValue(clientWithFlag(true));

    const result = await createApplication({ company: "ACME", position: "Engineer", status: "applied" });

    expect(result).toEqual({});
  });
});
