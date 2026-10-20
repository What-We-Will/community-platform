/**
 * @vitest-environment node
 */
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

import { makeProfileAccessRow } from "@/lib/__tests__/factories";
import { appliedFilter } from "@/lib/__tests__/supabase-mock";
import {
  makeSessionRequest,
  setUpSession,
  STATUS_COOKIES,
  SUPABASE_TEST_ENV,
} from "@/lib/__tests__/update-session-harness";
import { updateSession } from "./proxy";

describe("updateSession takes onboarding and approval from the member's profile row, not from cookies", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ...SUPABASE_TEST_ENV };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should report not approved when both status cookies are set but the profile is pending", async () => {
    setUpSession({
      profile: { data: makeProfileAccessRow({ approval_status: "pending" }), error: null },
    });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.isOnboarded).toBe(true);
    expect(result.isApproved).toBe(false);
  });

  it("should report not onboarded when the status cookies are set but the profile is not onboarded", async () => {
    setUpSession({
      profile: {
        data: makeProfileAccessRow({ is_onboarded: false, approval_status: "pending" }),
        error: null,
      },
    });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.isOnboarded).toBe(false);
    expect(result.isApproved).toBe(false);
  });

  it("should report onboarded and approved when the profile says so and no status cookies are sent", async () => {
    setUpSession({ profile: { data: makeProfileAccessRow(), error: null } });

    const result = await updateSession(makeSessionRequest());

    expect(result.user).toEqual({ id: "user-1" });
    expect(result.isOnboarded).toBe(true);
    expect(result.isApproved).toBe(true);
  });

  it("should read the signed-in member's own profile row when deciding access", async () => {
    const { queries } = setUpSession({
      user: { id: "member-42" },
      profile: { data: makeProfileAccessRow(), error: null },
    });

    await updateSession(makeSessionRequest());

    const statusRead = queries.find(
      (query) => query.table === "profiles" && query.calls.some((c) => c.method === "select")
    );
    expect(statusRead && appliedFilter(statusRead, "eq", "id", "member-42")).toBe(true);
  });

  it("should not set status cookies on the response when the profile is onboarded and approved", async () => {
    setUpSession({ profile: { data: makeProfileAccessRow(), error: null } });

    const { supabaseResponse } = await updateSession(makeSessionRequest());

    expect(supabaseResponse.cookies.get("profile_onboarded")).toBeUndefined();
    expect(supabaseResponse.cookies.get("profile_approved")).toBeUndefined();
  });

  it("should report no user and neither flag when the request is unauthenticated", async () => {
    setUpSession({ user: null });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.user).toBeNull();
    expect(result.isOnboarded).toBe(false);
    expect(result.isApproved).toBe(false);
  });
});
