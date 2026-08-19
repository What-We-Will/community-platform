/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeOnboardingInput } from "@/lib/__tests__/factories";
import { completeOnboarding } from "./actions";

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

describe("completeOnboarding — refuses callers without a session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Input that would otherwise be accepted, so a pass here can only mean the
  // session check ran — not that validation rejected the payload first.
  it("should error without querying when there is no authenticated user", async () => {
    const { client, queries } = buildMockSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValue(client as never);

    const result = await completeOnboarding(
      makeOnboardingInput({ linkedin_url: "https://linkedin.com/in/jane" })
    );

    expect(result).toEqual({
      error: "You must be signed in to complete onboarding.",
    });
    expect(queries).toHaveLength(0);
  });
});
