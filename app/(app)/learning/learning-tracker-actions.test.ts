/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/feature-flags", () => ({ canMutateFeature: vi.fn() }));
vi.mock("@/lib/groups", () => ({
  createGroup: vi.fn(),
  generateSlug: vi.fn(),
  joinGroup: vi.fn(),
  leaveGroup: vi.fn(),
}));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canMutateFeature } from "@/lib/feature-flags";
import { createGroup, generateSlug, joinGroup, leaveGroup } from "@/lib/groups";
import {
  addToTracker,
  updateTrackerStatus,
  removeFromTracker,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
} from "./learning-tracker-actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;
const mockCreateGroup = createGroup as MockedFunction<typeof createGroup>;
const mockGenerateSlug = generateSlug as MockedFunction<typeof generateSlug>;
const mockJoinGroup = joinGroup as MockedFunction<typeof joinGroup>;
const mockLeaveGroup = leaveGroup as MockedFunction<typeof leaveGroup>;

function makeChain(thenResult = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq", "order", "limit"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(singleResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

/** Dispatches from(table) against a per-table queue, consumed in call order —
 * needed for deleteStudyGroup, which queries learning_study_groups twice
 * (select, then delete) with different expected results. */
function tableClient(userId: string, tables: Record<string, any[]> = {}) {
  const consumed: Record<string, number> = {};
  const from = vi.fn((table: string) => {
    const queue = tables[table];
    if (!queue || queue.length === 0) return makeChain();
    const index = consumed[table] ?? 0;
    consumed[table] = index + 1;
    return queue[index] ?? queue[queue.length - 1];
  });
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    from,
  } as any;
}

function anonClient() {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: vi.fn(),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCanMutateFeature.mockResolvedValue(true);
});

// ── Mutation gate (learningTracker) ─────────────────────────────────────────
//
// Every exported action in this file must guard with canMutateFeature("learningTracker", ...)
// immediately after the auth check — the DIFFERENT key from app/(app)/tracker/actions.ts's
// jobApplicationTracker. An earlier plan revision gated both tracker action files with the
// same key; these tests assert the exact key argument per action.

type GuardCase = {
  name: string;
  call: () => Promise<{ error?: string; [k: string]: unknown }>;
};

const GUARD_CASES: GuardCase[] = [
  { name: "addToTracker", call: () => addToTracker("resource-1", "in_progress") },
  { name: "updateTrackerStatus", call: () => updateTrackerStatus("item-1", "completed") },
  { name: "removeFromTracker", call: () => removeFromTracker("item-1") },
  { name: "createStudyGroup", call: () => createStudyGroup("resource-1", "Group Name", "desc") },
  { name: "joinStudyGroup", call: () => joinStudyGroup("sg-1") },
  { name: "leaveStudyGroup", call: () => leaveStudyGroup("sg-1") },
  { name: "deleteStudyGroup", call: () => deleteStudyGroup("sg-1") },
];

describe.each(GUARD_CASES)("$name — mutation gate", ({ call }) => {
  it("returns the existing auth error for an unauthenticated caller without disclosing flag state", async () => {
    const client = anonClient();
    mockCreateClient.mockResolvedValue(client);

    const result = await call();

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockCanMutateFeature).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("denies an authenticated member when the flag is off", async () => {
    const client = tableClient("member-1");
    mockCreateClient.mockResolvedValue(client);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await call();

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledTimes(1);
    expect(mockCanMutateFeature).toHaveBeenCalledWith("learningTracker", { targetingKey: "member-1" });
    // Guard precedes every table read, including deleteStudyGroup's profile
    // and ownership lookups — no write path is reachable while denied.
    expect(client.from).not.toHaveBeenCalled();
    expect(mockCreateGroup).not.toHaveBeenCalled();
    expect(mockJoinGroup).not.toHaveBeenCalled();
    expect(mockLeaveGroup).not.toHaveBeenCalled();
  });

  it("denies an authenticated admin identically when the flag is off — no role ever reaches the guard", async () => {
    const client = tableClient("admin-1");
    mockCreateClient.mockResolvedValue(client);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await call();

    expect(result).toEqual({ error: "Feature not available" });
    // The action forwards only targetingKey — deleteStudyGroup's own
    // owner-or-admin branch cannot run because the profiles read it depends
    // on never executes while the guard denies.
    expect(mockCanMutateFeature).toHaveBeenCalledWith("learningTracker", { targetingKey: "admin-1" });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("reaches existing behavior when the flag is on", () => {
  it("addToTracker inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(tableClient("user-1"));

    const result = await addToTracker("resource-1", "in_progress");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("learningTracker", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
  });

  it("updateTrackerStatus updates and revalidates", async () => {
    mockCreateClient.mockResolvedValue(tableClient("user-1"));

    const result = await updateTrackerStatus("item-1", "completed");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
  });

  it("removeFromTracker deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(tableClient("user-1"));

    const result = await removeFromTracker("item-1");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
  });

  it("createStudyGroup creates the group and links it, revalidating", async () => {
    mockGenerateSlug.mockResolvedValue("group-name");
    mockCreateGroup.mockResolvedValue({
      id: "real-group-1",
      name: "Group Name",
      description: "desc",
      slug: "group-name",
      avatar_url: null,
      is_private: false,
      is_discoverable: false,
      is_study_group: true,
      archived: false,
      max_members: null,
      created_by: "user-1",
      conversation_id: "conv-1",
      created_at: "2026-07-31T00:00:00.000Z",
      updated_at: "2026-07-31T00:00:00.000Z",
    } as any);
    mockCreateClient.mockResolvedValue(
      tableClient("user-1", {
        learning_study_groups: [makeChain({ error: null }, { data: { id: "sg-1" }, error: null })],
      })
    );

    const result = await createStudyGroup("resource-1", "Group Name", "desc");

    expect(result).toEqual({ studyGroupId: "sg-1", groupSlug: "group-name" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
  });

  it("joinStudyGroup joins the real group and syncs membership, revalidating", async () => {
    mockJoinGroup.mockResolvedValue(undefined);
    mockCreateClient.mockResolvedValue(
      tableClient("user-1", {
        learning_study_groups: [makeChain({ error: null }, { data: { group_id: "real-group-1" }, error: null })],
      })
    );

    const result = await joinStudyGroup("sg-1");

    expect(result).toEqual({});
    expect(mockJoinGroup).toHaveBeenCalledWith("real-group-1", "user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
  });

  it("leaveStudyGroup leaves the real group and removes membership, revalidating", async () => {
    mockLeaveGroup.mockResolvedValue(null);
    mockCreateClient.mockResolvedValue(
      tableClient("user-1", {
        learning_study_groups: [makeChain({ error: null }, { data: { group_id: "real-group-1" }, error: null })],
      })
    );

    const result = await leaveStudyGroup("sg-1");

    expect(result).toEqual({});
    expect(mockLeaveGroup).toHaveBeenCalledWith("real-group-1", "user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
  });

  describe("deleteStudyGroup — existing ownership/admin authorization is unchanged", () => {
    it("lets the owner delete their own study group", async () => {
      mockCreateClient.mockResolvedValue(
        tableClient("user-1", {
          profiles: [makeChain({ error: null }, { data: { role: "member" }, error: null })],
          learning_study_groups: [
            makeChain({ error: null }, { data: { created_by: "user-1", group_id: "real-group-1" }, error: null }),
            makeChain({ error: null }),
          ],
          groups: [makeChain({ error: null })],
        })
      );

      const result = await deleteStudyGroup("sg-1");

      expect(result).toEqual({});
      expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    });

    it("lets an admin delete a study group they do not own", async () => {
      mockCreateClient.mockResolvedValue(
        tableClient("admin-1", {
          profiles: [makeChain({ error: null }, { data: { role: "admin" }, error: null })],
          learning_study_groups: [
            makeChain({ error: null }, { data: { created_by: "other-user", group_id: "real-group-1" }, error: null }),
            makeChain({ error: null }),
          ],
          groups: [makeChain({ error: null })],
        })
      );

      const result = await deleteStudyGroup("sg-1");

      expect(result).toEqual({});
    });

    it("denies a non-owner, non-admin exactly as before the guard existed", async () => {
      mockCreateClient.mockResolvedValue(
        tableClient("member-1", {
          profiles: [makeChain({ error: null }, { data: { role: "member" }, error: null })],
          learning_study_groups: [
            makeChain({ error: null }, { data: { created_by: "other-user", group_id: null }, error: null }),
          ],
        })
      );

      const result = await deleteStudyGroup("sg-1");

      expect(result).toEqual({ error: "Not authorized" });
    });

    it("returns Not found exactly as before the guard existed", async () => {
      mockCreateClient.mockResolvedValue(
        tableClient("user-1", {
          profiles: [makeChain({ error: null }, { data: { role: "member" }, error: null })],
          learning_study_groups: [makeChain({ error: null }, { data: null, error: null })],
        })
      );

      const result = await deleteStudyGroup("sg-1");

      expect(result).toEqual({ error: "Study group not found" });
    });
  });
});
