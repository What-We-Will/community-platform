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
// Someone who abandoned the form has not applied, so the admin queue must ask
// the database for submitted applications rather than for every pending row.
describe("Pending approvals page — queue holds submitted applications only", () => {
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

  it("should list the applicant when a completed application awaits review", async () => {
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

  it("should show the empty state when no submitted application is waiting", async () => {
    mockQueue([]);

    render(await ApprovalsPage());

    expect(screen.getByText(/no pending applications/i)).toBeInTheDocument();
  });
});
