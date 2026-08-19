/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_REQUIRED_ERROR,
  DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/utils/display-name";
import { updateProfile } from "./actions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

const validInput = {
  display_name: "Jane Doe",
  skills: ["TypeScript"],
  open_to_referrals: true,
};

// buildMockSupabaseClient() models read chains only — it has no upsert — and the
// assertion target here is the upsert payload, so the write path is mocked inline.
function mockAuthedUpsert() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: vi.fn().mockReturnValue({ upsert }),
  } as unknown as SupabaseServerClient);
  return upsert;
}

// The same bound is enforced by the Postgres CHECK constraint added in
// 20260818234828_bound_profiles_display_name_length.sql. The server guard must
// reject what the database would reject, and accept what it would accept —
// including for emoji, where JS string length and char_length() disagree.
describe("Profile edits are rejected when the display name is missing or over the shared limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the required error and skip the write when the name is empty", async () => {
    const upsert = mockAuthedUpsert();

    const result = await updateProfile({ ...validInput, display_name: "" });

    expect(result.error).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("should return the required error and skip the write when the name is whitespace-only", async () => {
    const upsert = mockAuthedUpsert();

    const result = await updateProfile({ ...validInput, display_name: "   " });

    expect(result.error).toBe(DISPLAY_NAME_REQUIRED_ERROR);
    expect(upsert).not.toHaveBeenCalled();
  });

  it(`should accept a name of exactly ${DISPLAY_NAME_MAX_LENGTH} characters`, async () => {
    const upsert = mockAuthedUpsert();
    const name = "a".repeat(DISPLAY_NAME_MAX_LENGTH);

    const result = await updateProfile({ ...validInput, display_name: name });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: name }),
      { onConflict: "id" }
    );
  });

  it(`should reject a name of ${DISPLAY_NAME_MAX_LENGTH + 1} characters without writing`, async () => {
    const upsert = mockAuthedUpsert();

    const result = await updateProfile({
      ...validInput,
      display_name: "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1),
    });

    expect(result.error).toBe(DISPLAY_NAME_TOO_LONG_ERROR);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("should persist the trimmed name when the value has surrounding whitespace", async () => {
    const upsert = mockAuthedUpsert();

    await updateProfile({ ...validInput, display_name: "  Jane Doe  " });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Jane Doe" }),
      { onConflict: "id" }
    );
  });
});
