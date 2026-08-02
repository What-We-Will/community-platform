/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/feature-flags", () => ({ canMutateFeature: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canMutateFeature } from "@/lib/feature-flags";
import {
  addToWishlist,
  removeFromWishlist,
  addJobComment,
  deleteJobComment,
} from "./community-actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;

function makeChain(thenResult = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "delete", "eq"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(singleResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

/** Builds a supabase client stub for an authenticated caller. Guard-denial tests
 * never need `from` wired up because the guard must short-circuit before any
 * table access — pass fromImpl only for on-path (flag enabled) tests. */
function authedClient(userId: string, fromImpl?: (...args: any[]) => any) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    from: fromImpl ?? vi.fn(),
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
  // Default the guard open so the pre-existing "reaches existing behavior"
  // tests below don't need to know about the flag at all.
  mockCanMutateFeature.mockResolvedValue(true);
});

// ── Mutation gate (ghostJobBoard) ───────────────────────────────────────────
//
// Every exported action in this file must guard with canMutateFeature("ghostJobBoard", ...)
// immediately after the auth check — a single flag, never combined with
// jobApplicationTracker (C05-RULING-004: the tracker dependency is a UI
// coherence decision, not a second mutation guard). These tests assert the
// exact key argument per action, not merely that some guard denies.

type GuardCase = {
  name: string;
  call: () => Promise<{ error?: string; [k: string]: unknown }>;
};

const GUARD_CASES: GuardCase[] = [
  { name: "addToWishlist", call: () => addToWishlist("job-1", "ACME", "Engineer") },
  { name: "removeFromWishlist", call: () => removeFromWishlist("job-1") },
  { name: "addJobComment", call: () => addJobComment("job-1", "great posting") },
  { name: "deleteJobComment", call: () => deleteJobComment("comment-1") },
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
    const client = authedClient("member-1");
    mockCreateClient.mockResolvedValue(client);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await call();

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledTimes(1);
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "member-1" });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("denies an authenticated admin identically when the flag is off — no role ever reaches the guard", async () => {
    const client = authedClient("admin-1");
    mockCreateClient.mockResolvedValue(client);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await call();

    expect(result).toEqual({ error: "Feature not available" });
    // The action forwards only targetingKey — no attributes/role are ever
    // constructed at this call site, so admin status cannot influence the
    // resolver's answer. canMutateFeature's own admin-exclusion contract is
    // covered separately in lib/feature-flags.authorization.test.ts.
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "admin-1" });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("reaches existing behavior when the flag is on", () => {
  it("addToWishlist inserts and revalidates when not already wishlisted", async () => {
    // maybeSingle() resolves with no existing row -> insert path
    mockCreateClient.mockResolvedValue(
      authedClient("user-1", vi.fn().mockReturnValue(makeChain({ error: null }, { data: null, error: null })))
    );

    const result = await addToWishlist("job-1", "ACME", "Engineer");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });

  it("addToWishlist returns the already_wishlisted sentinel without inserting", async () => {
    mockCreateClient.mockResolvedValue(
      authedClient("user-1", vi.fn().mockReturnValue(makeChain({ error: null }, { data: { id: "existing" }, error: null })))
    );

    const result = await addToWishlist("job-1", "ACME", "Engineer");

    expect(result).toEqual({ error: "already_wishlisted" });
  });

  it("removeFromWishlist deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await removeFromWishlist("job-1");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });

  it("addJobComment inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await addJobComment("job-1", "great posting");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("deleteJobComment deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await deleteJobComment("comment-1");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });
});
