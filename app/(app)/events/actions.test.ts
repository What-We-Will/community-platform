/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MockedFunction } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent } from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function makeDeleteChain() {
  const chain: Record<string, any> = {};
  ["delete", "eq"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve({ error: null }).then(r, j);
  chain.catch = (j: any) => Promise.resolve({ error: null }).catch(j);
  return chain;
}

describe("deleteEvent — revalidates affected pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act & Assert
    await expect(deleteEvent("event-1")).rejects.toThrow("Not authenticated");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful deletion", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "host-1" } } }),
      },
      from: vi.fn().mockReturnValue(makeDeleteChain()),
    } as any);

    // Act
    await deleteEvent("event-1");

    // Assert
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
