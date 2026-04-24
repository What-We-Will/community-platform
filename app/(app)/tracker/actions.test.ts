/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateApplication, updateStatusDate, deleteApplication } from "./actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(thenResult = { error: null }, singleResult: Record<string, any> = { data: null, error: null }) {
  const chain: Record<string, any> = {};
  ["select", "update", "delete", "eq", "single"].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue(singleResult);
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

describe("updateApplication — revalidates affected pages", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

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
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: jest.fn().mockReturnValue(makeChain()),
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
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await updateStatusDate("app-1", "applied", "2026-03-15");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful status date update", async () => {
    // Arrange
    // Two from() calls: select status_dates, then update
    const mockFrom = jest.fn()
      .mockReturnValueOnce(makeChain({ error: null }, { data: { status_dates: {} }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
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
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await deleteApplication("app-1");

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
    const result = await deleteApplication("app-1");

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
