/**
 * @vitest-environment node
 */
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

import { makePostgrestError, makeProfileAccessRow } from "@/lib/__tests__/factories";
import type { ApprovalStatus } from "@/lib/types";
import {
  makeSessionRequest,
  setUpSession,
  STATUS_COOKIES,
  SUPABASE_TEST_ENV,
} from "@/lib/__tests__/update-session-harness";
import { updateSession } from "./proxy";

describe("updateSession reports not onboarded and not approved when the profile row cannot vouch for the member", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env = { ...originalEnv, ...SUPABASE_TEST_ENV };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it("should report not onboarded and not approved when the profile row is missing", async () => {
    setUpSession({ profile: { data: null, error: null } });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.isOnboarded).toBe(false);
    expect(result.isApproved).toBe(false);
  });

  it("should report not onboarded and not approved when the profile read is denied", async () => {
    const denial = makePostgrestError();
    setUpSession({ profile: { data: null, error: denial } });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.isOnboarded).toBe(false);
    expect(result.isApproved).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "[proxy] profile read failed:",
      denial.message
    );
  });

  it("should report not approved when the profile carries an approval status outside the known set", async () => {
    setUpSession({
      profile: {
        data: makeProfileAccessRow({ approval_status: "APPROVED" as ApprovalStatus }),
        error: null,
      },
    });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.isOnboarded).toBe(true);
    expect(result.isApproved).toBe(false);
  });

  it("should report not onboarded when the profile's onboarding flag is null", async () => {
    setUpSession({
      profile: {
        data: makeProfileAccessRow({ is_onboarded: null as unknown as boolean }),
        error: null,
      },
    });

    const result = await updateSession(makeSessionRequest(STATUS_COOKIES));

    expect(result.isOnboarded).toBe(false);
  });
});
