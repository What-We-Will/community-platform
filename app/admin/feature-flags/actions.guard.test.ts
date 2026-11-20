/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("server-only", () => ({}));

import {
  makePostgrestError,
  makeProfileRoleRow,
  makeSetFeatureFlagInput,
} from "@/lib/__tests__/factories";
import { appliedFilter, buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { setFeatureFlagEnabled } from "./actions";

function mockSession(options: Parameters<typeof buildMockSupabaseClient>[0]) {
  const mock = buildMockSupabaseClient(options);
  createClient.mockResolvedValue(mock.client);
  return mock;
}

function flagWrites(queries: ReturnType<typeof buildMockSupabaseClient>["queries"]) {
  return queries.filter(({ table }) => table === "feature_flags");
}

describe("setFeatureFlagEnabled rejects bad input before touching the database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["an unknown flag key", { ...makeSetFeatureFlagInput(), key: "notAFlag" }],
    ["a non-boolean enabled value", { ...makeSetFeatureFlagInput(), enabled: "true" }],
    ["an unparseable expected timestamp", { ...makeSetFeatureFlagInput(), expectedUpdatedAt: "yesterday" }],
    ["a numeric expected timestamp that parses as a year", { ...makeSetFeatureFlagInput(), expectedUpdatedAt: 2026 }],
    ["no input at all", null],
  ])("should return invalid when given %s", async (_case, input) => {
    const result = await setFeatureFlagEnabled(
      input as unknown as Parameters<typeof setFeatureFlagEnabled>[0]
    );

    expect(result).toEqual({ ok: false, error: "invalid" });
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("setFeatureFlagEnabled only lets admins flip flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return unauthorized and write nothing when there is no session", async () => {
    const { queries } = mockSession({ user: null });

    const result = await setFeatureFlagEnabled(makeSetFeatureFlagInput());

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(flagWrites(queries)).toHaveLength(0);
  });

  it("should return unauthorized and write nothing when the session is rejected", async () => {
    // The profile is an admin, so only the session error can cause the rejection.
    const { queries } = mockSession({
      userError: { message: "JWT expired" },
      tables: { profiles: { data: makeProfileRoleRow({ role: "admin" }), error: null } },
    });

    const result = await setFeatureFlagEnabled(makeSetFeatureFlagInput());

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(flagWrites(queries)).toHaveLength(0);
  });

  it.each(["member", "moderator"] as const)("should return unauthorized and write nothing when the caller is a %s", async (role) => {
    const { queries } = mockSession({
      user: { id: "caller-7" },
      tables: { profiles: { data: makeProfileRoleRow({ role }), error: null } },
    });

    const result = await setFeatureFlagEnabled(makeSetFeatureFlagInput());

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(flagWrites(queries)).toHaveLength(0);
    const roleLookup = queries.find(({ table }) => table === "profiles")!;
    expect(appliedFilter(roleLookup, "eq", "id", "caller-7")).toBe(true);
  });

  it("should return unauthorized and write nothing when the role lookup fails", async () => {
    const { queries } = mockSession({
      tables: { profiles: { data: null, error: makePostgrestError({ code: "PGRST000", message: "connection refused" }) } },
    });

    const result = await setFeatureFlagEnabled(makeSetFeatureFlagInput());

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(flagWrites(queries)).toHaveLength(0);
  });
});
