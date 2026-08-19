/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildMockSupabaseClient, writeArgs } from "@/lib/__tests__/supabase-mock";
import { makeOnboardingInput } from "@/lib/__tests__/factories";
import { completeOnboarding } from "./actions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

function mockAuthedClient() {
  const { client, queries } = buildMockSupabaseClient({
    tables: { profiles: { data: null, error: null } },
  });

  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
  return queries;
}

// An admin can approve someone before they finish onboarding. Writing the status
// on submission would revert that approval, so onboarding leaves the column out
// of its payload and lets the existing row keep whatever an admin decided.
//
// The payload is the observable side effect available here. That an omitted
// column is actually preserved by Postgres is a database claim, asserted in
// supabase/tests/profiles_approval_status_default.sql.
describe("completeOnboarding — does not overwrite an admin's approval decision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should omit the approval status when persisting the submission", async () => {
    const queries = mockAuthedClient();

    const result = await completeOnboarding(
      makeOnboardingInput({ linkedin_url: "https://linkedin.com/in/jane" })
    );

    expect(result).toEqual({});
    const [payload, options] = writeArgs(queries[0], "upsert") ?? [];
    expect(payload).not.toHaveProperty("approval_status");
    expect(options).toEqual({ onConflict: "id" });
  });

  it("should still mark the profile onboarded when omitting the approval status", async () => {
    const queries = mockAuthedClient();

    await completeOnboarding(
      makeOnboardingInput({ linkedin_url: "https://linkedin.com/in/jane" })
    );

    const [payload] = writeArgs(queries[0], "upsert") ?? [];
    expect(payload).toMatchObject({ is_onboarded: true });
  });
});
