/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import {
  appliedFilter,
  buildMockSupabaseClient,
  writeArgs,
} from "@/lib/__tests__/supabase-mock";
import { updateEnabledFeatures } from "./actions";

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function mockAuthed(userId = "user-1") {
  const { client, queries } = buildMockSupabaseClient({
    user: { id: userId },
    tables: { profiles: { data: null, error: null } },
  });
  mockCreateClient.mockResolvedValue(client as never);
  return queries;
}

describe("updateEnabledFeatures — a member editing their own feature selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should error without querying when there is no authenticated user", async () => {
    const { client, queries } = buildMockSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValue(client as never);

    const result = await updateEnabledFeatures([...FEATURE_KEYS]);

    expect(result).toEqual({ error: "Not authenticated" });
    expect(queries).toHaveLength(0);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should reject without writing when a submitted key is unsupported", async () => {
    const queries = mockAuthed();

    const result = await updateEnabledFeatures(["events", "newsletter"]);

    expect(result.error).toMatch(/not a supported/i);
    expect(queries).toHaveLength(0);
  });

  it("should reject without writing when the same key is submitted twice", async () => {
    const queries = mockAuthed();

    const result = await updateEnabledFeatures(["events", "events"]);

    expect(result.error).toMatch(/once/i);
    expect(queries).toHaveLength(0);
  });

  it("should persist an empty selection when the member deselects everything", async () => {
    const queries = mockAuthed();

    const result = await updateEnabledFeatures([]);

    expect(result).toEqual({});
    expect(writeArgs(queries[0], "update")?.[0]).toEqual({
      enabled_features: [],
    });
  });

  // The action never takes a target id: the row it writes is the caller's own.
  it("should scope the write to the authenticated user's own profile row", async () => {
    const queries = mockAuthed("user-42");

    await updateEnabledFeatures(["events"]);

    expect(queries[0].table).toBe("profiles");
    expect(appliedFilter(queries[0], "eq", "id", "user-42")).toBe(true);
  });

  // The sidebar is rendered by the app layout, so the whole layout has to be
  // rebuilt for the new selection to show up.
  it("should revalidate the app layout so the nav reflects the new selection", async () => {
    mockAuthed();

    await updateEnabledFeatures([...FEATURE_KEYS]);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
