/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, createServiceClient, revalidatePath } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("server-only", () => ({}));

import {
  makePostgrestError,
  makeProfileRoleRow,
  makeSetFeatureFlagInput,
} from "@/lib/__tests__/factories";
import {
  appliedFilter,
  buildMockSupabaseClient,
  type MockQueryResult,
} from "@/lib/__tests__/supabase-mock";
import { setFeatureFlagEnabled } from "./actions";

const EXPECTED_UPDATED_AT = "2026-11-20T00:00:00.000Z";

function mockAdminWrite(writeResult: MockQueryResult) {
  const mock = buildMockSupabaseClient({
    tables: {
      profiles: { data: makeProfileRoleRow({ role: "admin" }), error: null },
      feature_flags: writeResult,
    },
  });
  createClient.mockResolvedValue(mock.client);
  return mock;
}

function flipProjectsOn() {
  return setFeatureFlagEnabled(
    makeSetFeatureFlagInput({ expectedUpdatedAt: EXPECTED_UPDATED_AT })
  );
}

describe("setFeatureFlagEnabled writes only the enabled column, guarded by the version it saw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([
    { key: "projects", enabled: true, expectedUpdatedAt: EXPECTED_UPDATED_AT },
    { key: "groupLearning", enabled: false, expectedUpdatedAt: "2026-11-19T08:30:00.000Z" },
  ] as const)(
    "should update only the $key flag's enabled column when the admin's loaded version still matches",
    async (input) => {
      const { queries } = mockAdminWrite({ data: [{ key: input.key }], error: null });

      const result = await setFeatureFlagEnabled(makeSetFeatureFlagInput(input));

      const write = queries.find(({ table }) => table === "feature_flags");
      expect(result).toEqual({ ok: true });
      expect(write).toBeDefined();
      expect(appliedFilter(write!, "update", { enabled: input.enabled })).toBe(true);
      expect(appliedFilter(write!, "eq", "key", input.key)).toBe(true);
      expect(appliedFilter(write!, "eq", "updated_at", input.expectedUpdatedAt)).toBe(true);
      // Without returning the row, a successful update looks like a version conflict.
      expect(appliedFilter(write!, "select", "key")).toBe(true);
    }
  );

  it("should never use the service-role client when an admin flips a flag", async () => {
    mockAdminWrite({ data: [{ key: "projects" }], error: null });

    await flipProjectsOn();

    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("should return ok and refresh the admin page and the nav when the write succeeds", async () => {
    mockAdminWrite({ data: [{ key: "projects" }], error: null });

    const result = await flipProjectsOn();

    expect(result).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/feature-flags");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("should return conflict and refresh nothing when no row matched the expected version", async () => {
    mockAdminWrite({ data: [], error: null });

    const result = await flipProjectsOn();

    expect(result).toEqual({ ok: false, error: "conflict" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("should return failed and refresh nothing when the database rejects the write", async () => {
    const dbError = makePostgrestError({ message: "permission denied for table feature_flags" });
    mockAdminWrite({ data: null, error: dbError });

    const result = await flipProjectsOn();

    expect(result).toEqual({ ok: false, error: "failed" });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.any(String), dbError);
  });
});
