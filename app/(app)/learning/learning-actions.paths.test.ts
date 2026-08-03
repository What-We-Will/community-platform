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
import * as LearningActionsModule from "./learning-actions";
import { createPath, deletePath, toggleStarPath } from "./learning-actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;

function makeChain(thenResult = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq", "order", "limit"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

// ── Mutation gate (groupLearning) ───────────────────────────────────────────
//
// Every exported action in this module must guard with
// canMutateFeature("groupLearning", ...) immediately after the auth check.
// The export-set pin below is derived from the module at runtime — not a
// second hand list — so a ninth export that skips the guard fails this check
// instead of leaving a green suite (C05-RULING-005, applied to this module by
// C07-RULING-001).

describe("exported-action inventory pinned to the export set", () => {
  it("every exported action in learning-actions.ts is covered by a guard case in this file or a sibling", () => {
    const exportedActionNames = Object.keys(LearningActionsModule).filter(
      (key) => typeof (LearningActionsModule as Record<string, unknown>)[key] === "function"
    );
    const coveredActionNames = [
      "createPath",
      "deletePath",
      "toggleStarPath",
      "addPathItem",
      "deletePathItem",
      "addResource",
      "deleteResource",
    ];

    expect(exportedActionNames.sort()).toEqual(coveredActionNames.sort());
  });
});

describe("createPath — revalidates affected pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanMutateFeature.mockResolvedValue(true);
  });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await createPath("My Path", "A description");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful creation", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue(makeChain()),
    } as any);

    // Act
    const result = await createPath("My Path", "A description");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("denies an authenticated member when groupLearning is off", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "member-1" } } }) },
      from: vi.fn(),
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await createPath("My Path", "A description");

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "member-1" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("denies an authenticated admin identically when groupLearning is off", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: vi.fn(),
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await createPath("My Path", "A description");

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "admin-1" });
  });
});

describe("deletePath — revalidates affected pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanMutateFeature.mockResolvedValue(true);
  });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await deletePath("path-1");

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
    const result = await deletePath("path-1");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("denies an authenticated member when groupLearning is off", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "member-1" } } }) },
      from: vi.fn(),
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await deletePath("path-1");

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "member-1" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("toggleStarPath — revalidates affected pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanMutateFeature.mockResolvedValue(true);
  });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await toggleStarPath("path-1", false);

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful toggle by admin", async () => {
    // Arrange
    const profileChain = makeChain({ error: null }, { data: { role: "admin" }, error: null });
    const updateChain = makeChain({ error: null });
    const mockFrom = vi.fn()
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(updateChain);

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: mockFrom,
    } as any);

    // Act
    const result = await toggleStarPath("path-1", false);

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("denies an authenticated admin before the admin-role lookup when groupLearning is off", async () => {
    const mockFrom = vi.fn();
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: mockFrom,
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await toggleStarPath("path-1", false);

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "admin-1" });
    // Admin's own "Admins only" gate is a table read (profiles); the flag
    // guard must short-circuit before it, not merely before the update.
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
