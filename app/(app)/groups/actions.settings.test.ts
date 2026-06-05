/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/groups", () => ({
  isSlugAvailable: vi.fn().mockResolvedValue(true),
  normalizeSlug: vi.fn().mockImplementation((s: string) => s),
}));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeSlug, isSlugAvailable } from "@/lib/groups";
import { updateGroupSettingsAction } from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockNormalizeSlug = normalizeSlug as MockedFunction<typeof normalizeSlug>;
const mockIsSlugAvailable = isSlugAvailable as MockedFunction<typeof isSlugAvailable>;

function makeClient(userId: string | null) {
  const chain: Record<string, any> = {};
  ["select", "update", "eq", "single"].forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain.single = vi.fn().mockResolvedValue({ data: { role: "member" }, error: null });
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

describe("updateGroupSettingsAction — revalidates affected pages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should not revalidate when user is not authenticated", async () => {
    mockCreateClient.mockResolvedValue(makeClient(null) as any);

    const result = await updateGroupSettingsAction("group-1", { is_discoverable: true });

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful settings update", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);

    const result = await updateGroupSettingsAction("group-1", { is_discoverable: true });

    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should revalidate on successful slug change", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);
    mockNormalizeSlug.mockReturnValue("new-slug");
    mockIsSlugAvailable.mockResolvedValue(true);

    const result = await updateGroupSettingsAction("group-1", { slug: "new-slug" });

    expect(result).toEqual({ newSlug: "new-slug" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/groups");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("should not revalidate when slug is invalid", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);
    mockNormalizeSlug.mockReturnValue("");

    const result = await updateGroupSettingsAction("group-1", { slug: "!!!" });

    expect(result).toEqual({ error: "Slug can only use lowercase letters, numbers, and hyphens." });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should not revalidate when slug is already taken", async () => {
    mockCreateClient.mockResolvedValue(makeClient("user-1") as any);
    mockNormalizeSlug.mockReturnValue("taken-slug");
    mockIsSlugAvailable.mockResolvedValue(false);

    const result = await updateGroupSettingsAction("group-1", { slug: "taken-slug" });

    expect(result).toEqual({ error: "This URL slug is already in use by another group." });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
