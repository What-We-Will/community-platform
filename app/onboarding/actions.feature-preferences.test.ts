/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { FEATURE_KEYS } from "@/lib/feature-keys";
import { buildMockSupabaseClient, writeArgs } from "@/lib/__tests__/supabase-mock";
import { makeOnboardingInput } from "@/lib/__tests__/factories";
import { completeOnboarding } from "./actions";

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

const withLink = { linkedin_url: "https://linkedin.com/in/jane" };

function mockAuthed() {
  const { client, queries } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: { profiles: { data: null, error: null } },
  });
  mockCreateClient.mockResolvedValue(client as never);
  return queries;
}

describe("completeOnboarding — the feature selection a new member submits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should error without querying when there is no authenticated user", async () => {
    const { client, queries } = buildMockSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValue(client as never);

    const result = await completeOnboarding(
      makeOnboardingInput({ ...withLink, enabled_features: ["events"] })
    );

    expect(result).toEqual({
      error: "You must be signed in to complete onboarding.",
    });
    expect(queries).toHaveLength(0);
  });

  it("should reject without writing when a submitted key is unsupported", async () => {
    const queries = mockAuthed();

    const result = await completeOnboarding(
      makeOnboardingInput({ ...withLink, enabled_features: ["newsletter"] })
    );

    expect(result.error).toMatch(/not a supported/i);
    expect(queries).toHaveLength(0);
  });

  it("should reject without writing when the same key is submitted twice", async () => {
    const queries = mockAuthed();

    const result = await completeOnboarding(
      makeOnboardingInput({ ...withLink, enabled_features: ["events", "events"] })
    );

    expect(result.error).toMatch(/once/i);
    expect(queries).toHaveLength(0);
  });

  it("should persist every feature when the member keeps them all selected", async () => {
    const queries = mockAuthed();

    const result = await completeOnboarding(
      makeOnboardingInput({ ...withLink, enabled_features: [...FEATURE_KEYS] })
    );

    expect(result).toEqual({});
    expect(writeArgs(queries[0], "upsert")?.[0]).toMatchObject({
      enabled_features: [...FEATURE_KEYS],
    });
  });

  it("should persist an empty selection when the member deselects everything", async () => {
    const queries = mockAuthed();

    const result = await completeOnboarding(
      makeOnboardingInput({ ...withLink, enabled_features: [] })
    );

    expect(result).toEqual({});
    expect(writeArgs(queries[0], "upsert")?.[0]).toMatchObject({
      enabled_features: [],
    });
  });
});
