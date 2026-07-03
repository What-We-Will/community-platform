/**
 * @vitest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

const baseInput = {
  display_name: "Jane Doe",
  skills: ["TypeScript"],
  open_to_referrals: true,
};

function mockSupabaseClient(upsert = vi.fn().mockResolvedValue({ error: null })) {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "jane@example.com" } },
      }),
    },
    from: vi.fn().mockReturnValue({ upsert }),
  } as any);
  return upsert;
}

describe("completeOnboarding — requires at least one verification link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("errors when linkedin, github, and portfolio URLs are all empty", async () => {
    const upsert = mockSupabaseClient();

    const result = await completeOnboarding({ ...baseInput });

    expect(result).toEqual({
      error:
        "Please provide at least one of LinkedIn, GitHub, or a personal website so we can verify your background.",
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("errors when all three URLs are whitespace-only", async () => {
    const upsert = mockSupabaseClient();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "   ",
      github_url: "  ",
      portfolio_url: " ",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("succeeds with only a LinkedIn URL", async () => {
    const upsert = mockSupabaseClient();

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
    const upsert = mockSupabaseClient();

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
    const upsert = mockSupabaseClient();

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
    const upsert = mockSupabaseClient();

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

describe("completeOnboarding — rejects non-http(s) or malformed URLs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a javascript: URL", async () => {
    const upsert = mockSupabaseClient();

    const result = await completeOnboarding({
      ...baseInput,
      linkedin_url: "javascript:alert(1)",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a data: URL", async () => {
    const upsert = mockSupabaseClient();

    const result = await completeOnboarding({
      ...baseInput,
      github_url: "data:text/html,<script>alert(1)</script>",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed URL", async () => {
    const upsert = mockSupabaseClient();

    const result = await completeOnboarding({
      ...baseInput,
      portfolio_url: "not-a-url",
    });

    expect(result.error).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });
});
