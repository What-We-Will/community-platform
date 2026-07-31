/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  buildMockSupabaseClient,
  type RecordedQuery,
} from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import { FeatureComingSoon } from "@/components/shared/FeatureComingSoon";
import LearningTrackerPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

/** Wires the profile role, the flag row, and empty tracker tables. */
function setUpLearningTracker({
  role,
  enabled,
}: {
  role: "member" | "admin";
  enabled: boolean;
}): RecordedQuery[] {
  const { client, queries } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: { data: { role }, error: null },
      feature_flags: {
        data: [makeFeatureFlagRow({ key: "learningTracker", enabled })],
        error: null,
      },
      personal_learning_items: { data: [], error: null },
      learning_study_group_members: { data: [], error: null },
    },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
  return queries;
}

function ranFeatureDataQuery(queries: RecordedQuery[]): boolean {
  return queries.some((q) => q.table === "personal_learning_items");
}

describe("Learning tracker page feature gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should show the coming-soon page and skip tracker queries for a member when the flag is off", async () => {
    const queries = setUpLearningTracker({ role: "member", enabled: false });

    const result = await LearningTrackerPage();

    expect(result.type).toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(false);
  });

  it("should render the real page and run tracker queries for a member when the flag is on", async () => {
    const queries = setUpLearningTracker({ role: "member", enabled: true });

    const result = await LearningTrackerPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(true);
  });

  it("should render the real page for an admin previewing an off flag", async () => {
    const queries = setUpLearningTracker({ role: "admin", enabled: false });

    const result = await LearningTrackerPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(true);
  });
});
