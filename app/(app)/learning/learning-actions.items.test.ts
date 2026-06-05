/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addPathItem, deletePathItem } from "./learning-actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function makeChain(thenResult: Record<string, any> = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq", "order", "limit"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

describe("addPathItem — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await addPathItem("path-1", "Title", "https://example.com", "Desc");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate when creator adds an item", async () => {
    // Arrange
    // Promise.all calls from("learning_paths") then from("profiles") simultaneously,
    // then from("learning_path_items") twice (position query, then insert)
    const mockFrom = vi.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { created_by: "user-1" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }, { data: { role: "member" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null, data: [] }, { data: [], error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: mockFrom,
    } as any);

    // Act
    const result = await addPathItem("path-1", "New Item", "https://example.com", "Desc");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("deletePathItem — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await deletePathItem("item-1", "path-1");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate when creator deletes an item", async () => {
    // Arrange
    // Promise.all calls from("learning_paths") then from("profiles"),
    // then from("learning_path_items") for the delete
    const mockFrom = vi.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { created_by: "user-1" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }, { data: { role: "member" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: mockFrom,
    } as any);

    // Act
    const result = await deletePathItem("item-1", "path-1");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
