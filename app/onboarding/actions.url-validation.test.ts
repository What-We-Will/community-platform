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

describe("completeOnboarding — rejects non-https or malformed URLs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an http: URL — the admin email renders these as live hrefs", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "http://linkedin.com/in/jane",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a javascript: URL", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "javascript:alert(1)",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a data: URL", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      github_url: "data:text/html,<script>alert(1)</script>",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed URL", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding({
      ...baseInput,
      portfolio_url: "not-a-url",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});
