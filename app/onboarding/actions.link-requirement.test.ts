/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

const baseInput = {
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
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "jane@example.com" } },
      }),
    },
    from: vi.fn().mockReturnValue({ upsert }),
  } as unknown as SupabaseServerClient);
  return upsert;
}

describe("completeOnboarding — requires at least one verification link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("errors when linkedin, github, and portfolio URLs are all empty", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({ ...baseInput });

    expect(result).toEqual({
      error:
        "Please provide at least one of LinkedIn, GitHub, or a personal website so we can verify your background.",
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("errors when all three URLs are whitespace-only", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "   ",
      github_url: "  ",
      portfolio_url: " ",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});
