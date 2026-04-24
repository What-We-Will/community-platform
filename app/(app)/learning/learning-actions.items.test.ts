/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addPathItem, deletePathItem } from "./learning-actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(thenResult: Record<string, any> = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq", "order", "limit"].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

describe("addPathItem — revalidates affected pages", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
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
    const mockFrom = jest.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { created_by: "user-1" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }, { data: { role: "member" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null, data: [] }, { data: [], error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
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
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
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
    const mockFrom = jest.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { created_by: "user-1" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }, { data: { role: "member" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
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
