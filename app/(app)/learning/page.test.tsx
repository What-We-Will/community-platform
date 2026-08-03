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
import GroupLearningPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

const FEATURE_DATA_TABLES = [
  "learning_paths",
  "learning_path_items",
  "learning_resources",
  "personal_learning_items",
  "learning_study_groups",
  "learning_study_group_members",
];

/**
 * Wires the profile role and both new-flag rows asymmetrically — groupLearning
 * is the variable under test, projects is always the opposite value — so a
 * copy/paste bug that reads the wrong key fails instead of passing under a
 * fixture where every flag happens to agree.
 */
function setUpLearningPage({
  role,
  groupLearning,
}: {
  role: "member" | "admin";
  groupLearning: boolean;
}): RecordedQuery[] {
  const { client, queries } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: { data: { role }, error: null },
      feature_flags: {
        data: [
          makeFeatureFlagRow({ key: "groupLearning", enabled: groupLearning }),
          makeFeatureFlagRow({ key: "projects", enabled: !groupLearning }),
        ],
        error: null,
      },
      learning_paths: { data: [], error: null },
      learning_path_items: { data: [], error: null },
      learning_resources: { data: [], error: null },
      personal_learning_items: { data: [], error: null },
      learning_study_groups: { data: [], error: null },
      learning_study_group_members: { data: [], error: null },
    },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
  return queries;
}

function ranFeatureDataQuery(queries: RecordedQuery[]): boolean {
  return queries.some((q) => FEATURE_DATA_TABLES.includes(q.table));
}

describe("Group Learning page feature gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should show the coming-soon page and skip every feature data query for a member when groupLearning is off", async () => {
    const queries = setUpLearningPage({ role: "member", groupLearning: false });

    const result = await GroupLearningPage();

    expect(result.type).toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(false);
  });

  it("should render the real page and run feature data queries for a member when groupLearning is on", async () => {
    const queries = setUpLearningPage({ role: "member", groupLearning: true });

    const result = await GroupLearningPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(true);
  });

  it("should render the real page for an admin previewing groupLearning off", async () => {
    const queries = setUpLearningPage({ role: "admin", groupLearning: false });

    const result = await GroupLearningPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(true);
  });
});
