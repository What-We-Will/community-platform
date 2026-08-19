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

describe("completeOnboarding — persists only the links that were submitted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds with only a LinkedIn URL", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "https://linkedin.com/in/jane",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: "https://linkedin.com/in/jane",
        github_url: null,
        portfolio_url: null,
      }),
      { onConflict: "id" }
    );
  });

  it("succeeds with only a GitHub URL", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      github_url: "https://github.com/jane",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: null,
        github_url: "https://github.com/jane",
        portfolio_url: null,
      }),
      { onConflict: "id" }
    );
  });

  it("succeeds with only a portfolio URL", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      portfolio_url: "https://jane.dev",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: null,
        github_url: null,
        portfolio_url: "https://jane.dev",
      }),
      { onConflict: "id" }
    );
  });

  it("succeeds when multiple links are provided", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "https://linkedin.com/in/jane",
      github_url: "https://github.com/jane",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: "https://linkedin.com/in/jane",
        github_url: "https://github.com/jane",
        portfolio_url: null,
      }),
      { onConflict: "id" }
    );
  });
});
