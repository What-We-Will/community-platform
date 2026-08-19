/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { makeOnboardingInput } from "@/lib/__tests__/factories";
import { completeOnboarding } from "./actions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

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

  it("should reject without writing when a link is http: — the admin email renders these as live hrefs", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding(
      makeOnboardingInput({
        linkedin_url: "http://linkedin.com/in/jane",
      })
    );

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("should reject without writing when a link is javascript:", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding(
      makeOnboardingInput({
        linkedin_url: "javascript:alert(1)",
      })
    );

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("should reject without writing when a link is data:", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding(
      makeOnboardingInput({
        github_url: "data:text/html,<script>alert(1)</script>",
      })
    );

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("should reject without writing when a link is unparseable", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding(
      makeOnboardingInput({
        portfolio_url: "not-a-url",
      })
    );

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});
