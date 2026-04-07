/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/groups", () => ({
  isSlugAvailable: jest.fn().mockResolvedValue(true),
  normalizeSlug: jest.fn().mockImplementation((s: string) => s),
}));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeSlug, isSlugAvailable } from "@/lib/groups";
import { updateGroupSettingsAction } from "./actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockNormalizeSlug = normalizeSlug as jest.MockedFunction<typeof normalizeSlug>;
const mockIsSlugAvailable = isSlugAvailable as jest.MockedFunction<typeof isSlugAvailable>;

function makeClient(userId: string | null) {
  const chain: Record<string, any> = {};
  ["select", "update", "eq", "single"].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: { role: "member" }, error: null });
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

describe("updateGroupSettingsAction — cache revalidation", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("should return an error when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    const result = await updateGroupSettingsAction("group-1", { is_discoverable: true });

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate /groups and /dashboard on successful settings update", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    const result = await updateGroupSettingsAction("group-1", { is_discoverable: true });

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should return newSlug when slug is updated successfully", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);
    mockNormalizeSlug.mockReturnValue("new-slug");
    mockIsSlugAvailable.mockResolvedValue(true);

    const result = await updateGroupSettingsAction("group-1", { slug: "new-slug" });

    expect(result).toEqual({ newSlug: "new-slug" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should return an error when slug is invalid", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);
    mockNormalizeSlug.mockReturnValue("");

    const result = await updateGroupSettingsAction("group-1", { slug: "!!!" });

    expect(result).toEqual({ error: "Slug can only use lowercase letters, numbers, and hyphens." });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should return an error when slug is already taken", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);
    mockNormalizeSlug.mockReturnValue("taken-slug");
    mockIsSlugAvailable.mockResolvedValue(false);

    const result = await updateGroupSettingsAction("group-1", { slug: "taken-slug" });

    expect(result).toEqual({ error: "This URL slug is already in use by another group." });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
