/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createApplication, addInterview, deleteInterview } from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function makeChain(thenResult = { error: null }) {
  const chain: Record<string, any> = {};
  ["select", "insert", "delete", "eq", "single"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve(thenResult).then(r, j);
  chain.catch = (j: any) => Promise.resolve(thenResult).catch(j);
  return chain;
}

function makeClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: vi.fn().mockReturnValue(makeChain()),
  };
}

describe("createApplication — revalidates affected pages", () => {
  const input = { company: "ACME", position: "Engineer", status: "applied" as const };

  beforeEach(() => { vi.clearAllMocks(); });

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
  beforeEach(() => { vi.clearAllMocks(); });

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
  beforeEach(() => { vi.clearAllMocks(); });

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
