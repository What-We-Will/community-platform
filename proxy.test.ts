/**
 * @vitest-environment node
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";
import { updateSession } from "@/lib/supabase/proxy";

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: vi.fn(),
}));

function makeRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("proxy session-failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should redirect to login when the session refresh fails on a protected route", async () => {
    vi.mocked(updateSession).mockRejectedValue(new Error("supabase unreachable"));

    const response = await proxy(makeRequest("/dashboard"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") as string);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe("/dashboard");
  });

  it("should allow the request when the session refresh fails on a public route", async () => {
    vi.mocked(updateSession).mockRejectedValue(new Error("supabase unreachable"));

    const response = await proxy(makeRequest("/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("should fail closed for every authenticated app route when the session refresh fails", async () => {
    vi.mocked(updateSession).mockRejectedValue(new Error("supabase unreachable"));
    const appRoutes = readdirSync(join(__dirname, "app/(app)"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/${entry.name}`);

    for (const route of appRoutes) {
      const response = await proxy(makeRequest(route));

      expect(response.status, `${route} must redirect when the session layer fails`).toBe(307);
    }
  });

  it("should redirect to login when an unauthenticated user requests a protected route", async () => {
    vi.mocked(updateSession).mockResolvedValue({
      supabaseResponse: NextResponse.next(),
      user: null,
      isOnboarded: false,
      isApproved: false,
    });

    const response = await proxy(makeRequest("/messages"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") as string).pathname).toBe("/login");
  });
});
