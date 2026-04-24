/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addResource, deleteResource } from "./learning-actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(thenResult = { error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "update", "delete", "eq", "order", "limit"].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

describe("addResource — revalidates affected pages", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
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
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: jest.fn().mockReturnValue(makeChain()),
    } as any);

    // Act
    const result = await addResource("course", "Title", "https://example.com", "Desc");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("deleteResource — revalidates affected pages", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
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
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: jest.fn().mockReturnValue(makeChain()),
    } as any);

    // Act
    const result = await deleteResource("resource-1");

    // Assert
    expect(result).toEqual({ error: null });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/learning");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
