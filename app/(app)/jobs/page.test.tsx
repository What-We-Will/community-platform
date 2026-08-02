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
import JobBoardPage from "./page";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

/** Wires the profile role, both flags, and empty jobs tables. */
function setUpJobBoard({
  role,
  ghostJobBoard,
  jobApplicationTracker = false,
}: {
  role: "member" | "admin";
  ghostJobBoard: boolean;
  jobApplicationTracker?: boolean;
}): RecordedQuery[] {
  const { client, queries } = buildMockSupabaseClient({
    user: { id: "user-1" },
    tables: {
      profiles: { data: { role }, error: null },
      feature_flags: {
        data: [
          makeFeatureFlagRow({ key: "ghostJobBoard", enabled: ghostJobBoard }),
          makeFeatureFlagRow({ key: "jobApplicationTracker", enabled: jobApplicationTracker }),
        ],
        error: null,
      },
      job_postings: { data: [], error: null },
      job_applications: { data: [], error: null },
      job_posting_comments: { data: [], error: null },
    },
  });
  mockCreateClient.mockResolvedValue(client as unknown as SupabaseServerClient);
  return queries;
}

function ranJobsDataQuery(queries: RecordedQuery[]): boolean {
  return queries.some((q) =>
    ["job_postings", "job_applications", "job_posting_comments"].includes(q.table)
  );
}

function noSearchParams() {
  return Promise.resolve({});
}

describe("Job Board page feature gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  it("should show the coming-soon page and skip jobs queries for a member when the flag is off", async () => {
    const queries = setUpJobBoard({ role: "member", ghostJobBoard: false });

    const result = await JobBoardPage({ searchParams: noSearchParams() });

    expect(result.type).toBe(FeatureComingSoon);
    expect(ranJobsDataQuery(queries)).toBe(false);
  });

  it("should render the real page and run jobs queries for a member when the flag is on", async () => {
    const queries = setUpJobBoard({ role: "member", ghostJobBoard: true });

    const result = await JobBoardPage({ searchParams: noSearchParams() });

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranJobsDataQuery(queries)).toBe(true);
  });

  it("should render the real page for an admin previewing an off flag", async () => {
    const queries = setUpJobBoard({ role: "admin", ghostJobBoard: false });

    const result = await JobBoardPage({ searchParams: noSearchParams() });

    expect(result.type).not.toBe(FeatureComingSoon);
    expect(ranJobsDataQuery(queries)).toBe(true);
  });
});

describe("Job Board wishlist control view condition (C05-RULING-004)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureFlagCacheForTests();
  });

  function wishlistProp(result: Awaited<ReturnType<typeof JobBoardPage>>): unknown {
    // <Suspense><JobBoardClient .../></Suspense>
    return (result.props.children as { props: { showWishlistControl: unknown } }).props
      .showWishlistControl;
  }

  it("shows the wishlist control for a member when both flags are on", async () => {
    setUpJobBoard({ role: "member", ghostJobBoard: true, jobApplicationTracker: true });

    const result = await JobBoardPage({ searchParams: noSearchParams() });

    expect(wishlistProp(result)).toBe(true);
  });

  it("hides the wishlist control for a member when the tracker flag is off", async () => {
    setUpJobBoard({ role: "member", ghostJobBoard: true, jobApplicationTracker: false });

    const result = await JobBoardPage({ searchParams: noSearchParams() });

    expect(wishlistProp(result)).toBe(false);
  });

  it("shows the wishlist control for an admin previewing both flags off", async () => {
    setUpJobBoard({ role: "admin", ghostJobBoard: false, jobApplicationTracker: false });

    const result = await JobBoardPage({ searchParams: noSearchParams() });

    expect(wishlistProp(result)).toBe(true);
  });
});
