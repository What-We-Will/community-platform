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
  createApplication,
  updateApplication,
  updateStatusDate,
  syncCommunityNote,
  addInterview,
  deleteInterview,
  requestHelp,
  cancelHelp,
  deleteApplication,
} from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;

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

describe("updateApplication — revalidates affected pages", () => {
  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(anonClient());

    // Act
    const result = await updateApplication("app-1", { company: "ACME" });

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful update", async () => {
    // Arrange
    // No status change in input — single from() call for the update
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue(makeChain()),
    } as any);

    // Act
    const result = await updateApplication("app-1", { company: "ACME" });

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("updateStatusDate — revalidates affected pages", () => {
  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(anonClient());

    // Act
    const result = await updateStatusDate("app-1", "applied", "2026-03-15");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful status date update", async () => {
    // Arrange
    // Two from() calls: select status_dates, then update
    const mockFrom = vi.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { status_dates: {} }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: mockFrom,
    } as any);

    // Act
    const result = await updateStatusDate("app-1", "applied", "2026-03-15");

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("deleteApplication — revalidates affected pages", () => {
  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(anonClient());

    // Act
    const result = await deleteApplication("app-1");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful deletion", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue(makeChain()),
    } as any);

    // Act
    const result = await deleteApplication("app-1");

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

// ── Mutation gate (jobApplicationTracker) ───────────────────────────────────
//
// Every exported action in this file must guard with canMutateFeature("jobApplicationTracker", ...)
// immediately after the auth check. An earlier plan revision gated both tracker
// action files with the same key — these tests assert the exact
// key argument per action, not merely that some guard denies.

type GuardCase = {
  name: string;
  call: () => Promise<{ error?: string; [k: string]: unknown }>;
};

const GUARD_CASES: GuardCase[] = [
  { name: "createApplication", call: () => createApplication({ company: "ACME", position: "Engineer", status: "applied" }) },
  { name: "updateApplication", call: () => updateApplication("app-1", { company: "ACME" }) },
  { name: "updateStatusDate", call: () => updateStatusDate("app-1", "applied", "2026-03-15") },
  { name: "syncCommunityNote", call: () => syncCommunityNote("posting-1", "great tips") },
  { name: "addInterview", call: () => addInterview("app-1", "Phone screen", "2026-03-15", "10:00", "notes") },
  { name: "deleteInterview", call: () => deleteInterview("iv-1") },
  { name: "requestHelp", call: () => requestHelp("app-1", "title", "ACME", "Engineer", "2026-03-15", null, null, "help please") },
  { name: "cancelHelp", call: () => cancelHelp("help-1") },
  { name: "deleteApplication", call: () => deleteApplication("app-1") },
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
    expect(mockCanMutateFeature).toHaveBeenCalledWith("jobApplicationTracker", { targetingKey: "member-1" });
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
    expect(mockCanMutateFeature).toHaveBeenCalledWith("jobApplicationTracker", { targetingKey: "admin-1" });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("reaches existing behavior when the flag is on", () => {
  it("createApplication inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await createApplication({ company: "ACME", position: "Engineer", status: "applied" });

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("jobApplicationTracker", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });

  it("syncCommunityNote inserts a new comment and revalidates", async () => {
    // maybeSingle() resolves with no existing comment -> insert path
    mockCreateClient.mockResolvedValue(
      authedClient("user-1", vi.fn().mockReturnValue(makeChain({ error: null }, { data: null, error: null })))
    );

    const result = await syncCommunityNote("posting-1", "great tips");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("syncCommunityNote deletes when content is cleared", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await syncCommunityNote("posting-1", "   ");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("addInterview inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await addInterview("app-1", "Phone screen", "2026-03-15", "10:00", "notes");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });

  it("deleteInterview deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await deleteInterview("iv-1");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });

  it("requestHelp inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await requestHelp("app-1", "title", "ACME", "Engineer", "2026-03-15", null, null, "help please");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });

  it("cancelHelp deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await cancelHelp("help-1");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
  });
});
