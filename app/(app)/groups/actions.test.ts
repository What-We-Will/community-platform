/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/groups", () => ({
  generateSlug: jest.fn().mockResolvedValue("test-slug"),
  createGroup: jest.fn().mockResolvedValue({ slug: "test-slug", id: "group-1" }),
  joinGroup: jest.fn().mockResolvedValue(undefined),
  leaveGroup: jest.fn().mockResolvedValue(null),
  isSlugAvailable: jest.fn().mockResolvedValue(true),
  normalizeSlug: jest.fn().mockReturnValue("test-slug"),
}));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createGroupAction,
  joinGroupAction,
  leaveGroupAction,
  updateGroupSettingsAction,
} from "./actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function makeClient(userId: string | null) {
  const chain: Record<string, any> = {};
  ["select", "update", "insert", "delete", "eq", "single"].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (r: any, j: any) => Promise.resolve({ error: null }).then(r, j);
  chain.catch = (j: any) => Promise.resolve({ error: null }).catch(j);
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: jest.fn().mockReturnValue(chain),
  };
}

describe("createGroupAction — cache revalidation", () => {
  const input = { name: "Test Group", description: null, isPrivate: false, isDiscoverable: true };

  beforeEach(() => { jest.clearAllMocks(); });

  it("should return an error when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await createGroupAction(input);

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate /groups and /dashboard on successful creation", async () => {
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

describe("joinGroupAction — cache revalidation", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return an error when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await joinGroupAction("group-1");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate /groups and /dashboard on successful join", async () => {
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

describe("leaveGroupAction — cache revalidation", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return an error when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await leaveGroupAction("group-1");

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate /groups and /dashboard on successful leave", async () => {
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

describe("updateGroupSettingsAction — cache revalidation", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return an error when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    // Act
    const result = await updateGroupSettingsAction("group-1", { is_discoverable: true });

    // Assert
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate /groups and /dashboard on successful settings update", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    // Act
    const result = await updateGroupSettingsAction("group-1", { is_discoverable: true });

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
