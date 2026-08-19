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

// An admin can approve someone before they finish onboarding. Writing the status
// on submission would revert that approval, so onboarding leaves the column out
// of its payload and lets the existing row keep whatever an admin decided.
describe("completeOnboarding — does not overwrite an admin's approval decision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should omit the approval status when persisting the submission", async () => {
    const upsert = mockAuthedUpsert();

    const result = await completeOnboarding(
      makeOnboardingInput({ linkedin_url: "https://linkedin.com/in/jane" })
    );

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      expect.not.objectContaining({ approval_status: expect.anything() }),
      { onConflict: "id" }
    );
  });

  it("should still mark the profile onboarded when omitting the approval status", async () => {
    const upsert = mockAuthedUpsert();

    await completeOnboarding(
      makeOnboardingInput({ linkedin_url: "https://linkedin.com/in/jane" })
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ is_onboarded: true }),
      { onConflict: "id" }
    );
  });
});
