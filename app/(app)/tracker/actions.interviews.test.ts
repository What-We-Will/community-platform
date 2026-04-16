/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createApplication, addInterview, deleteInterview } from "./actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeChain(thenResult = { error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "delete", "eq", "single"].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

function makeClient(userId: string | null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: jest.fn().mockReturnValue(makeChain()),
  };
}

describe("createApplication — revalidates affected pages", () => {
  const input = { company: "ACME", position: "Engineer", status: "applied" as const };

  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    const result = await createApplication(input);

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful creation", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    const result = await createApplication(input);

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("addInterview — revalidates affected pages", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    const result = await addInterview("app-1", "Phone screen", "2026-04-10", "14:00", "");

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful insert", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    const result = await addInterview("app-1", "Phone screen", "2026-04-10", "14:00", "");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("deleteInterview — revalidates affected pages", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    const result = await deleteInterview("interview-1");

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful deletion", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    const result = await deleteInterview("interview-1");

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tracker");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
