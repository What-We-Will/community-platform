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
import { addResource, deleteResource } from "./learning-actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCanMutateFeature = canMutateFeature as MockedFunction<typeof canMutateFeature>;

function makeChain(thenResult = { error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq", "order", "limit"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

describe("addResource — revalidates affected pages", () => {
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
    const result = await addResource("course", "Title", "https://example.com", "Desc");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful add", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue(makeChain()),
    } as any);

    // Act
    const result = await addResource("course", "Title", "https://example.com", "Desc");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("denies an authenticated member when groupLearning is off", async () => {
    const mockFrom = vi.fn();
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "member-1" } } }) },
      from: mockFrom,
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await addResource("course", "Title", "https://example.com", "Desc");

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "member-1" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("denies an authenticated admin identically when groupLearning is off", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: vi.fn(),
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await addResource("course", "Title", "https://example.com", "Desc");

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "admin-1" });
  });
});

describe("deleteResource — revalidates affected pages", () => {
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
    const result = await deleteResource("resource-1");

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
    const result = await deleteResource("resource-1");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("denies an authenticated member when groupLearning is off", async () => {
    const mockFrom = vi.fn();
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "member-1" } } }) },
      from: mockFrom,
    } as any);
    mockCanMutateFeature.mockResolvedValue(false);

    const result = await deleteResource("resource-1");

    expect(result).toEqual({ error: "Feature not available" });
    expect(mockCanMutateFeature).toHaveBeenCalledWith("groupLearning", { targetingKey: "member-1" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
