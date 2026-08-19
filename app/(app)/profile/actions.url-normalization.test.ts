/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
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

// The WHATWG URL parser trims surrounding whitespace and removes embedded
// tab/CR/LF before it checks a scheme, so a raw string can pass validation and
// still differ from what gets stored. These pin that the value which satisfied
// validation is the value that reaches the database.
describe("Profile verification links are persisted in the same form that was validated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should persist the trimmed link when the submitted value has surrounding whitespace", async () => {
    const upsert = mockAuthedUpsert();

    const result = await updateProfile({
      ...validInput,
      linkedin_url: "  https://linkedin.com/in/jane  ",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ linkedin_url: "https://linkedin.com/in/jane" }),
      { onConflict: "id" }
    );
  });

  it("should persist null rather than a blank string when a link is whitespace-only", async () => {
    const upsert = mockAuthedUpsert();

    const result = await updateProfile({
      ...validInput,
      linkedin_url: "   ",
      github_url: "\t\n",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ linkedin_url: null, github_url: null }),
      { onConflict: "id" }
    );
  });

  it("should strip the embedded tab the URL parser ignored instead of storing it raw", async () => {
    const upsert = mockAuthedUpsert();

    const result = await updateProfile({
      ...validInput,
      github_url: "https://git\thub.com/jane",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ github_url: "https://github.com/jane" }),
      { onConflict: "id" }
    );
  });

  it("should normalize all three links when every field is submitted padded", async () => {
    const upsert = mockAuthedUpsert();

    await updateProfile({
      ...validInput,
      linkedin_url: " https://linkedin.com/in/jane ",
      github_url: " https://github.com/jane ",
      portfolio_url: " https://jane.dev ",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: "https://linkedin.com/in/jane",
        github_url: "https://github.com/jane",
        portfolio_url: "https://jane.dev",
      }),
      { onConflict: "id" }
    );
  });
});
