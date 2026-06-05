/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPath, deletePath, toggleStarPath } from "./learning-actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

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

describe("createPath — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
});

describe("deletePath — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
});

describe("toggleStarPath — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
});
