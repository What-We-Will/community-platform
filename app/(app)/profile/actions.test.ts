/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, deleteResume } from "./actions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockRevalidatePath = revalidatePath as MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function asClient(mock: unknown): SupabaseServerClient {
  return mock as SupabaseServerClient;
}

const validInput = {
  display_name: "Jane Doe",
  skills: ["TypeScript"],
  open_to_referrals: true,
};

describe("updateProfile — revalidates affected pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not revalidate when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(
      asClient({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      })
    );

    // Act
    const result = await updateProfile(validInput);

    // Assert
    expect(result).toEqual({ error: "You must be signed in to update your profile." });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate on successful update but not /profile", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue(
      asClient({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      })
    );

    // Act
    const result = await updateProfile(validInput);

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/members");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).not.toHaveBeenCalledWith("/profile");
  });
});

interface DeleteMockOptions {
  user?: { id: string } | null;
  resumePath?: string | null;
  selectError?: { message: string } | null;
  updateError?: { message: string } | null;
  removeResult?: { data: unknown[] | null; error: { message: string } | null };
}

function mockSupabaseForDelete({
  user = { id: "user-1" },
  resumePath = "user-1/resume.pdf",
  selectError = null,
  updateError = null,
  removeResult = { data: [{ name: "resume.pdf" }], error: null },
}: DeleteMockOptions = {}) {
  const remove = vi.fn().mockResolvedValue(removeResult);
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({
      data: resumePath ? { resume_path: resumePath } : null,
      error: selectError,
    });
  const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) });
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: updateError }) });

  return {
    supabase: asClient({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
      from: vi.fn().mockReturnValue({ select, update }),
      storage: { from: vi.fn().mockReturnValue({ remove }) },
    }),
    remove,
    update,
  };
}

describe("deleteResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when the user is not authenticated", async () => {
    const { supabase, remove, update } = mockSupabaseForDelete({ user: null });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await deleteResume();

    expect(result).toEqual({ error: "Not authenticated" });
    expect(remove).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("is a no-op when the profile has no resume", async () => {
    const { supabase, remove, update } = mockSupabaseForDelete({ resumePath: null });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await deleteResume();

    expect(result).toEqual({});
    expect(remove).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns an error when the profile lookup fails", async () => {
    const { supabase, remove, update } = mockSupabaseForDelete({
      resumePath: null,
      selectError: { message: "lookup failed" },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await deleteResume();

    expect(result).toEqual({ error: "lookup failed" });
    expect(remove).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("clears resume_path before removing the file from storage", async () => {
    const { supabase, remove, update } = mockSupabaseForDelete({
      resumePath: "user-1/resume.pdf",
    });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await deleteResume();

    expect(result).toEqual({});
    expect(remove).toHaveBeenCalledWith(["user-1/resume.pdf"]);
    expect(update).toHaveBeenCalledWith({ resume_path: null });
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0]
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("returns an error and skips storage removal when clearing resume_path fails", async () => {
    const { supabase, remove } = mockSupabaseForDelete({
      updateError: { message: "db down" },
    });
    mockCreateClient.mockResolvedValue(supabase);

    const result = await deleteResume();

    expect(result).toEqual({ error: "db down" });
    expect(remove).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalledWith("/profile");
  });

  it("still succeeds but logs when the storage removal errors", async () => {
    const { supabase } = mockSupabaseForDelete({
      removeResult: { data: null, error: { message: "storage down" } },
    });
    mockCreateClient.mockResolvedValue(supabase);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteResume();

    expect(result).toEqual({});
    expect(consoleError).toHaveBeenCalledWith(
      "[deleteResume] storage cleanup incomplete:",
      "storage down"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
    consoleError.mockRestore();
  });

  it("still succeeds but logs when storage removes zero objects", async () => {
    const { supabase } = mockSupabaseForDelete({
      removeResult: { data: [], error: null },
    });
    mockCreateClient.mockResolvedValue(supabase);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteResume();

    expect(result).toEqual({});
    expect(consoleError).toHaveBeenCalledWith(
      "[deleteResume] storage cleanup incomplete:",
      "no objects removed"
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
    consoleError.mockRestore();
  });
});
