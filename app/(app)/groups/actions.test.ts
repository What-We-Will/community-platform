/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/groups", () => ({
  generateSlug: vi.fn().mockResolvedValue("test-slug"),
  createGroup: vi.fn().mockResolvedValue({ slug: "test-slug", id: "group-1" }),
  joinGroup: vi.fn().mockResolvedValue(undefined),
  leaveGroup: vi.fn().mockResolvedValue(null),
  isSlugAvailable: vi.fn().mockResolvedValue(true),
  normalizeSlug: vi.fn().mockReturnValue("test-slug"),
}));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createGroupAction,
  joinGroupAction,
  leaveGroupAction,
} from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function makeClient(userId: string | null) {
  const chain: Record<string, any> = {};
  ["select", "update", "insert", "delete", "eq", "single"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve({ error: null }).then(r, j);
  chain.catch = (j: any) => Promise.resolve({ error: null }).catch(j);
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: vi.fn().mockReturnValue(chain),
  };
}

describe("createGroupAction — revalidates affected pages", () => {
  const input = { name: "Test Group", description: null, isPrivate: false, isDiscoverable: true };

  beforeEach(() => { vi.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await createGroupAction(input);

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful creation", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    // Act
    const result = await createGroupAction(input);

    // Assert
    expect(result).toMatchObject({ slug: "test-slug" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("joinGroupAction — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await joinGroupAction("group-1");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful join", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    // Act
    const result = await joinGroupAction("group-1");

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("leaveGroupAction — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await leaveGroupAction("group-1");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful leave", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    // Act
    const result = await leaveGroupAction("group-1");

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

