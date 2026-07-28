/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  appliedFilter,
  buildMockSupabaseClient,
  type RecordedQuery,
} from "@/lib/__tests__/supabase-mock";
import { PROFILE_ROLES } from "@/lib/utils/roles";
import MembersPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

/** Runs the page for a given `?role=` value and returns the member listing query. */
async function listingQueryFor(
  role: string | string[] | undefined
): Promise<RecordedQuery> {
  const { client, queries } = buildMockSupabaseClient({
    tables: { profiles: [{ data: [], error: null }, { data: [], error: null }] },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);

  await MembersPage({ searchParams: Promise.resolve({ role }) });

  // The page issues the listing query first, then the skill-options query.
  return queries[0];
}

describe("Members page role filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(PROFILE_ROLES)(
    "should filter the listing by '%s' when that role is requested",
    async (role) => {
      const query = await listingQueryFor(role);

      expect(appliedFilter(query, "eq", "role", role)).toBe(true);
    }
  );

  it("should not filter by role when no role is requested", async () => {
    const query = await listingQueryFor(undefined);

    expect(query.calls.some((call) => call.args[0] === "role")).toBe(false);
  });

  it.each(["ADMIN", "true", " admin", "superuser", ""])(
    "should not filter by role when the requested role is '%s'",
    async (role) => {
      const query = await listingQueryFor(role);

      expect(query.calls.some((call) => call.args[0] === "role")).toBe(false);
    }
  );

  // A repeated param arrives as an array. It has no coherent meaning as a
  // filter, and must not silently collapse to whichever value came first.
  it("should not filter by role when the role param is repeated", async () => {
    const query = await listingQueryFor(["member", "admin"]);

    expect(query.calls.some((call) => call.args[0] === "role")).toBe(false);
  });

  it("should keep the onboarded-only constraint alongside a role filter", async () => {
    const query = await listingQueryFor("admin");

    expect(appliedFilter(query, "eq", "is_onboarded", true)).toBe(true);
    expect(appliedFilter(query, "eq", "role", "admin")).toBe(true);
  });
});
