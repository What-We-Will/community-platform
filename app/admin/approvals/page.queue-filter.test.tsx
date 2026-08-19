/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import {
  appliedFilter,
  buildMockSupabaseClient,
} from "@/lib/__tests__/supabase-mock";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import type { Profile } from "@/lib/types";
import ApprovalsPage from "./page";

const { createClient, createServiceClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));
vi.mock("./actions", () => ({ approveUser: vi.fn(), rejectUser: vi.fn() }));

function mockQueue(rows: Profile[]) {
  const { client, queries } = buildMockSupabaseClient({
    tables: { profiles: { data: rows, error: null } },
  });

  createClient.mockResolvedValue(client);
  createServiceClient.mockReturnValue({
    auth: {
      admin: {
        getUserById: vi
          .fn()
          .mockResolvedValue({ data: { user: { email: "jane@example.com" } } }),
      },
    },
  });

  return queries;
}

// A profiles row exists from the moment an account does — the signup trigger
// creates it before onboarding runs, with every verification URL still NULL.
// Filtering the queue on is_onboarded removes that abandoned-signup class.
//
// Tested boundary: these assert the queue's own predicates and its rendering of
// what the query returns. They do NOT establish that every row reaching the
// queue was submitted through the onboarding form. is_onboarded is the closest
// signal the schema offers, not a submission marker, and two other write paths
// set it without requiring a verification link — updateProfile
// (app/(app)/profile/actions.ts:74) and app/api/test-upsert/route.ts:41. Proving
// the stronger claim needs a protected submission marker; until then, treat a
// queue row as "onboarding flag set", not "application submitted".
describe("Pending approvals page — abandoned signups are excluded from the queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should exclude abandoned signups when querying the queue", async () => {
    const queries = mockQueue([]);

    await ApprovalsPage();

    expect(appliedFilter(queries[0], "eq", "is_onboarded", true)).toBe(true);
  });

  it("should still restrict the queue to pending profiles when excluding abandoned signups", async () => {
    const queries = mockQueue([]);

    await ApprovalsPage();

    expect(appliedFilter(queries[0], "eq", "approval_status", "pending")).toBe(
      true
    );
  });

  it("should list the profile when an onboarded row awaits review", async () => {
    mockQueue([
      makeBaseProfile({
        display_name: "Real Applicant",
        approval_status: "pending",
        is_onboarded: true,
      }),
    ]);

    render(await ApprovalsPage());

    expect(screen.getByText("Real Applicant")).toBeInTheDocument();
    expect(screen.queryByText(/no pending applications/i)).toBeNull();
  });

  it("should show the empty state when no onboarded profile is waiting", async () => {
    mockQueue([]);

    render(await ApprovalsPage());

    expect(screen.getByText(/no pending applications/i)).toBeInTheDocument();
  });
});
