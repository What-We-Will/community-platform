/**
 * @vitest-environment node
 */
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("server-only", () => ({}));

import { isValidElement, type ReactElement } from "react";
import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  buildMockSupabaseClient,
  type RecordedQuery,
} from "@/lib/__tests__/supabase-mock";
import { makeFeatureFlagRow } from "@/lib/__tests__/factories";
import { resetFeatureFlagCacheForTests } from "@/lib/feature-flags";
import { FeatureComingSoon } from "@/components/shared/FeatureComingSoon";
import { LearningTrackerClient } from "./LearningTrackerClient";
import LearningTrackerPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

/**
 * Wires the profile role and both relevant flag rows asymmetrically —
 * learningTracker gates the page, groupLearning gates the in-page CTAs — so a
 * copy/paste bug that reads the wrong key fails instead of passing under a
 * fixture where every flag happens to agree.
 */
function setUpLearningTracker({
  role,
  learningTracker,
  groupLearning,
}: {
  role: "member" | "admin";
  learningTracker: boolean;
  groupLearning: boolean;
}): RecordedQuery[] {
  const { client, queries } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: { data: { role }, error: null },
      feature_flags: {
        data: [
          makeFeatureFlagRow({ key: "learningTracker", enabled: learningTracker }),
          makeFeatureFlagRow({ key: "groupLearning", enabled: groupLearning }),
        ],
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

/** Walks the returned element tree to find LearningTrackerClient's own props. */
function findGroupLearningCtaProp(node: unknown): boolean | undefined {
  if (!isValidElement(node)) return undefined;
  const element = node as ReactElement<{ showGroupLearningCta?: boolean; children?: unknown }>;
  if (element.type === LearningTrackerClient) {
    return element.props.showGroupLearningCta;
  }
  const children = element.props.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findGroupLearningCtaProp(child);
    if (found !== undefined) return found;
  }
  return undefined;
}

describe("Learning tracker page feature gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should show the coming-soon page and skip tracker queries for a member when learningTracker is off", async () => {
    const queries = setUpLearningTracker({
      role: "member",
      learningTracker: false,
      groupLearning: true,
    });

    const result = await LearningTrackerPage();

    expect(result.type).toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(false);
  });

  it("should render the real page and run tracker queries for a member when learningTracker is on", async () => {
    const queries = setUpLearningTracker({
      role: "member",
      learningTracker: true,
      groupLearning: false,
    });

    const result = await LearningTrackerPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(true);
  });

  it("should render the real page for an admin previewing learningTracker off", async () => {
    const queries = setUpLearningTracker({
      role: "admin",
      learningTracker: false,
      groupLearning: true,
    });

    const result = await LearningTrackerPage();

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranFeatureDataQuery(queries)).toBe(true);
  });

  it("should pass groupLearning's own value as showGroupLearningCta, not learningTracker's", async () => {
    const onResult = await (async () => {
      setUpLearningTracker({ role: "member", learningTracker: true, groupLearning: true });
      return LearningTrackerPage();
    })();
    expect(findGroupLearningCtaProp(onResult)).toBe(true);

    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();

    const offResult = await (async () => {
      setUpLearningTracker({ role: "member", learningTracker: true, groupLearning: false });
      return LearningTrackerPage();
    })();
    expect(findGroupLearningCtaProp(offResult)).toBe(false);
  });
});
