/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  buildMockSupabaseClient,
  type RecordedQuery,
} from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import { FeatureComingSoon } from "@/components/shared/FeatureComingSoon";
import ProjectsPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;
const mockCreateAdminClient = createAdminClient as MockedFunction<typeof createAdminClient>;

const ORIGINAL_ENV = { ...process.env };

/**
 * Wires the profile role and both new-flag rows asymmetrically — projects is
 * the variable under test, groupLearning is always the opposite value — so a
 * copy/paste bug that reads the wrong key fails instead of passing under a
 * fixture where every flag happens to agree. Service-role env vars are always
 * present so the admin (service-role) read path would be reachable if the
 * gate did not precede it.
 */
function setUpProjectsPage({
  role,
  projects,
}: {
  role: "member" | "admin";
  projects: boolean;
}): RecordedQuery[] {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

  const { client, queries } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: { data: { role }, error: null },
      feature_flags: {
        data: [
          makeFeatureFlagRow({ key: "projects", enabled: projects }),
          makeFeatureFlagRow({ key: "groupLearning", enabled: !projects }),
        ],
        error: null,
      },
      projects: { data: [], error: null },
    },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
  return queries;
}

describe("Projects page feature gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should show the coming-soon page and skip both the service-role read and the regular query for a member when projects is off", async () => {
    const queries = setUpProjectsPage({ role: "member", projects: false });

    const result = await ProjectsPage();

    expect(result.type).toBe(FeatureComingSoon);
    expect(mockCreateAdminClient).not.toHaveBeenCalled();
    expect(queries.some((q) => q.table === "projects")).toBe(false);
  });

  it("should render the real page and run the service-role read for a member when projects is on", async () => {
    const queries = setUpProjectsPage({ role: "member", projects: true });

    const result = await ProjectsPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(mockCreateAdminClient).toHaveBeenCalled();
    // The admin client bypasses the recorded regular-client query builder
    // entirely; its own call above is the evidence the read was attempted.
    expect(queries.some((q) => q.table === "profiles")).toBe(true);
  });

  it("should render the real page for an admin previewing projects off", async () => {
    setUpProjectsPage({ role: "admin", projects: false });

    const result = await ProjectsPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(mockCreateAdminClient).toHaveBeenCalled();
  });
});
