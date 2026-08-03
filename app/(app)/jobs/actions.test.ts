/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/feature-flags", () => ({ canMutateFeature: vi.fn() }));
vi.mock("@/lib/messages", () => ({
  findExistingDM: vi.fn(),
  createDMConversation: vi.fn(),
}));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canMutateFeature } from "@/lib/feature-flags";
import { findExistingDM, createDMConversation } from "@/lib/messages";
import * as ActionsModule from "./actions";
import {
  createJobPosting,
  updateJobPosting,
  messageJobPoster,
  deleteJobPosting,
} from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockRedirect = redirect as MockedFunction<typeof redirect>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;
const mockFindExistingDM = findExistingDM as MockedFunction<typeof findExistingDM>;
const mockCreateDMConversation = createDMConversation as MockedFunction<typeof createDMConversation>;

function makeChain(thenResult = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq"].forEach((m) => {
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
// immediately after the auth check. These tests assert the exact key argument
// per action, not merely that some guard denies.

type GuardCase = {
  name: string;
  call: () => Promise<{ error?: string; [k: string]: unknown }>;
};

const GUARD_CASES: GuardCase[] = [
  { name: "createJobPosting", call: () => createJobPosting({ title: "Engineer", company: "ACME", job_type: "full_time" }) },
  { name: "updateJobPosting", call: () => updateJobPosting("job-1", { title: "Senior Engineer" }) },
  { name: "deleteJobPosting", call: () => deleteJobPosting("job-1") },
];

// messageJobPoster can't share GUARD_CASES's { error? } shape (Promise<never>);
// it's guard-tested separately below. Deriving exportedActionNames from the
// module at runtime — not a second hand list — is what makes a future
// ungated export fail this check instead of leaving a green suite.
describe("exported-action inventory pinned to the export set", () => {
  it("every exported action has a guard case or its own guard describe", () => {
    const exportedActionNames = Object.keys(ActionsModule).filter(
      (key) => typeof (ActionsModule as Record<string, unknown>)[key] === "function"
    );
    const coveredActionNames = [...GUARD_CASES.map((c) => c.name), "messageJobPoster"];

    expect(exportedActionNames.sort()).toEqual(coveredActionNames.sort());
  });
});

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
  it("createJobPosting inserts and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await createJobPosting({ title: "Engineer", company: "ACME", job_type: "full_time" });

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("updateJobPosting verifies ownership/admin then updates and revalidates", async () => {
    // Three from() calls in order: posting select, profile select, update.
    const mockFrom = vi.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { posted_by: "user-1" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }, { data: { role: "member" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue(authedClient("user-1", mockFrom));

    const result = await updateJobPosting("job-1", { title: "Senior Engineer" });

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });

  it("updateJobPosting denies a non-owner non-admin", async () => {
    const mockFrom = vi.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { posted_by: "someone-else" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }, { data: { role: "member" }, error: null }));

    mockCreateClient.mockResolvedValue(authedClient("user-1", mockFrom));

    const result = await updateJobPosting("job-1", { title: "Senior Engineer" });

    expect(result).toEqual({ error: "Not authorized" });
  });

  it("deleteJobPosting deletes and revalidates", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1", vi.fn().mockReturnValue(makeChain())));

    const result = await deleteJobPosting("job-1");

    expect(result).toEqual({});
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/jobs");
  });
});

// ── messageJobPoster — Promise<never>, terminates by redirect ───────────────
//
// This action is typed Promise<never> and exits by redirect(), so it cannot
// return { error: ... } without breaking its type and callers. Denial must
// terminate the same way the existing `!user` check does: by redirecting,
// never by returning. These tests assert the redirect destination itself —
// the denial mechanism — not merely that messaging was not reached.

describe("messageJobPoster — redirect termination", () => {
  it("redirects to /login for an unauthenticated caller without disclosing flag state", async () => {
    mockCreateClient.mockResolvedValue(anonClient());

    await expect(messageJobPoster("poster-1")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
    expect(mockCanMutateFeature).not.toHaveBeenCalled();
    expect(mockFindExistingDM).not.toHaveBeenCalled();
  });

  it("redirects to /jobs for an authenticated member when the flag is off", async () => {
    mockCreateClient.mockResolvedValue(authedClient("member-1"));
    mockCanMutateFeature.mockResolvedValue(false);

    await expect(messageJobPoster("poster-1")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/jobs");
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "member-1" });
    expect(mockFindExistingDM).not.toHaveBeenCalled();
    expect(mockCreateDMConversation).not.toHaveBeenCalled();
  });

  it("redirects to /jobs for an authenticated admin identically when the flag is off — admin preview cannot message through a gated action", async () => {
    mockCreateClient.mockResolvedValue(authedClient("admin-1"));
    mockCanMutateFeature.mockResolvedValue(false);

    await expect(messageJobPoster("poster-1")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/jobs");
    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "admin-1" });
    expect(mockFindExistingDM).not.toHaveBeenCalled();
  });

  it("finds an existing conversation and redirects to it when the flag is on", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1"));
    mockFindExistingDM.mockResolvedValue("conv-1");

    await expect(messageJobPoster("poster-1")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockCanMutateFeature).toHaveBeenCalledWith("ghostJobBoard", { targetingKey: "user-1" });
    expect(mockRedirect).toHaveBeenCalledWith("/messages/conv-1");
    expect(mockCreateDMConversation).not.toHaveBeenCalled();
  });

  it("creates a new conversation and redirects to it when none exists and the flag is on", async () => {
    mockCreateClient.mockResolvedValue(authedClient("user-1"));
    mockFindExistingDM.mockResolvedValue(null);
    mockCreateDMConversation.mockResolvedValue("conv-2");

    await expect(messageJobPoster("poster-1")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/messages/conv-2");
  });
});
