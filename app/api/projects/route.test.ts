/**
 * @vitest-environment node
 *
 * This route was discovered during the Phase 7 deep-link audit: it is not a
 * link/CTA and was not enumerated in the phase card, but it independently
 * reads the `projects` table through the same service-role client the gated
 * page uses, and until this test it carried no feature-flag check at all —
 * any authenticated user, flag on or off, could call it directly. Gated here
 * with the same canViewFeature("projects", ...) contract as the page so the
 * flag actually governs every live read path for this feature, not just the
 * one the card named.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/feature-flags", () => ({ canViewFeature: vi.fn() }));

import type { MockedFunction } from "vitest";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { canViewFeature } from "@/lib/feature-flags";

const mockCreateAdminClient = createAdminClient as MockedFunction<typeof createAdminClient>;
const mockCreateServerClient = createServerClient as MockedFunction<typeof createServerClient>;
const mockCanViewFeature = canViewFeature as MockedFunction<typeof canViewFeature>;

function serverClientFor(userId: string | null, role?: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: role ? { role } : null, error: null }),
    }),
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  // The route creates its admin client once at module load, not per-request,
  // so each test needs a fresh module instance to pick up that test's mock
  // return value for createClient.
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/projects", () => {
  it("returns 401 for an unauthenticated caller without ever building an admin client for this request", async () => {
    mockCreateServerClient.mockResolvedValue(serverClientFor(null));
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mockCanViewFeature).not.toHaveBeenCalled();
  });

  it("returns 404 for an authenticated member when projects is off, without querying the projects table", async () => {
    mockCreateServerClient.mockResolvedValue(serverClientFor("member-1", "member"));
    mockCanViewFeature.mockResolvedValue(false);
    const fromSpy = vi.fn();
    mockCreateAdminClient.mockReturnValue({ from: fromSpy } as any);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(404);
    expect(mockCanViewFeature).toHaveBeenCalledWith("projects", { targetingKey: "member-1", attributes: { role: "member" } });
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it("returns project data for an authenticated member when projects is on", async () => {
    mockCreateServerClient.mockResolvedValue(serverClientFor("member-1", "member"));
    mockCanViewFeature.mockResolvedValue(true);
    const order = vi.fn().mockResolvedValue({ data: [{ id: "p1" }], error: null });
    const select = vi.fn().mockReturnValue({ order });
    mockCreateAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as any);
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([{ id: "p1" }]);
  });

  it("returns project data for an admin previewing projects off", async () => {
    mockCreateServerClient.mockResolvedValue(serverClientFor("admin-1", "admin"));
    mockCanViewFeature.mockResolvedValue(true);
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn().mockReturnValue({ order });
    mockCreateAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as any);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockCanViewFeature).toHaveBeenCalledWith("projects", { targetingKey: "admin-1", attributes: { role: "admin" } });
  });
});
