import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { vi } from "vitest";
import { buildMockSupabaseClient, type MockQueryResult } from "./supabase-mock";

/** Cookie values an older build cached client-side; the session layer must ignore them. */
export const STATUS_COOKIES = "profile_onboarded=1; profile_approved=1";

export const SUPABASE_TEST_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
};

/**
 * Points the mocked `@supabase/ssr` createServerClient at a recording client.
 * The calling test file must `vi.mock("@supabase/ssr", ...)` itself.
 */
export function setUpSession({
  user = { id: "user-1" },
  profile,
}: {
  user?: { id: string } | null;
  profile?: MockQueryResult;
}) {
  const mock = buildMockSupabaseClient({
    user,
    tables: profile ? { profiles: profile } : {},
  });
  vi.mocked(createServerClient).mockReturnValue(
    mock.client as unknown as ReturnType<typeof createServerClient>
  );
  return mock;
}

export function makeSessionRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3000/dashboard", {
    headers: cookie ? { cookie } : {},
  });
}
