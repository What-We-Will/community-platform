import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const LAST_SEEN_COOKIE = "last_seen";
const LAST_SEEN_THRESHOLD_MS = 1 * 60 * 1000; // 1 minute — keep status accurate for chat

// Caches is_onboarded=true in a cookie so we don't query the DB on every request.
// The middleware only does a DB lookup when this cookie is absent (first request
// per browser session, or after cookie expiry).
export const ONBOARDED_COOKIE = "profile_onboarded";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      supabaseResponse: NextResponse.next({ request }),
      user: null,
      isOnboarded: false,
    };
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            supabaseResponse.cookies.set(name, value, options ?? {});
          } catch {
            supabaseResponse.cookies.set(name, value);
          }
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOnboarded = false;

  if (user) {
    // ── Onboarding status ──────────────────────────────────────────────────
    // Check the cookie cache first to avoid a DB round-trip on every request.
    if (request.cookies.get(ONBOARDED_COOKIE)?.value === "1") {
      isOnboarded = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_onboarded, last_seen_at")
        .eq("id", user.id)
        .maybeSingle();

      isOnboarded = profile?.is_onboarded ?? false;

      if (isOnboarded) {
        // Cache so future requests skip the DB query (30-day TTL)
        supabaseResponse.cookies.set(ONBOARDED_COOKIE, "1", {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
      }
    }

    // ── last_seen_at update ────────────────────────────────────────────────
    const lastSeenCookie = request.cookies.get(LAST_SEEN_COOKIE)?.value;
    const now = Date.now();
    const shouldUpdate =
      !lastSeenCookie ||
      now - parseInt(lastSeenCookie, 10) > LAST_SEEN_THRESHOLD_MS;

    if (shouldUpdate) {
      void supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", user.id);

      supabaseResponse.cookies.set(LAST_SEEN_COOKIE, now.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
  }

  return { supabaseResponse, user, isOnboarded };
}
