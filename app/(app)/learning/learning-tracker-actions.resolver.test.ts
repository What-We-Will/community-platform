/**
 * @vitest-environment node
 *
 * Proves the mutation gate wires through the REAL feature-flag resolver rather
 * than only a mocked canMutateFeature. learning-tracker-actions.test.ts mocks
 * @/lib/feature-flags entirely for its per-action matrix; this file leaves it
 * unmocked and drives resolution through a mocked supabase feature_flags table
 * instead. deleteStudyGroup is the representative action because it is the
 * highest-risk call site — its own profiles read and ownership branch must
 * never run while the real resolver denies.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/groups", () => ({
  createGroup: vi.fn(),
  generateSlug: vi.fn(),
  joinGroup: vi.fn(),
  leaveGroup: vi.fn(),
}));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { deleteStudyGroup } from "./learning-tracker-actions";

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function makeChain(thenResult: Record<string, any> = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

/** Dispatches from() by table: feature_flags serves the resolver's own read;
 * profiles and learning_study_groups are stubbed so a wrongly-placed guard
 * (below the profile/ownership reads) would still be observable as a pass —
 * their presence is what the "never called while denied" assertion checks. */
function clientWithFlag(enabled: boolean, userId = "admin-1") {
  const fromCalls: string[] = [];
  const from = vi.fn((table: string) => {
    fromCalls.push(table);
    if (table === "feature_flags") {
      return makeChain({
        data: [makeFeatureFlagRow({ key: "learningTracker", enabled })],
        error: null,
      });
    }
    if (table === "profiles") {
      return makeChain({ error: null }, { data: { role: "admin" }, error: null });
    }
    if (table === "learning_study_groups") {
      return makeChain({ error: null }, { data: { created_by: "other-user", group_id: "real-group-1" }, error: null });
    }
    return makeChain({ error: null });
  });
  return {
    client: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
      from,
    } as any,
    fromCalls,
  };
}

describe("deleteStudyGroup — real feature-flag resolver wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("denies the mutation via the real resolver before the profile or ownership reads run, even for an admin", async () => {
    const { client, fromCalls } = clientWithFlag(false, "admin-1");
    mockCreateClient.mockResolvedValue(client);

    const result = await deleteStudyGroup("sg-1");

    expect(result).toEqual({ error: "Feature not available" });
    // Only the resolver's own feature_flags read happened — the action's
    // profiles and learning_study_groups reads never ran.
    expect(fromCalls).toEqual(["feature_flags"]);
  });

  it("reaches the existing owner-or-admin authorization when the real resolver reports the flag on", async () => {
    const { client } = clientWithFlag(true, "admin-1");
    mockCreateClient.mockResolvedValue(client);

    const result = await deleteStudyGroup("sg-1");

    expect(result).toEqual({});
  });
});
