import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const LAST_SEEN_COOKIE = "last_seen";
const LAST_SEEN_THRESHOLD_MS = 1 * 60 * 1000; // 1 minute — keep status accurate for chat

// Caches is_onboarded=true in a cookie so we don't query the DB on every request.
// The middleware only does a DB lookup when this cookie is absent (first request
// per browser session, or after cookie expiry).
export const ONBOARDED_COOKIE = "profile_onboarded";

// Caches approval_status=approved in a short-lived cookie (5 min TTL).
// Short TTL ensures approval takes effect within 5 minutes of admin action.
export const APPROVED_COOKIE = "profile_approved";
const APPROVED_COOKIE_TTL = 5 * 60; // 5 minutes

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
      isApproved: false,
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
  let isApproved = false;

  if (user) {
    // ── Onboarding + approval status ──────────────────────────────────────────
    // Fast path: both cookies present — skip DB round-trip.
    const onboardedCookie = request.cookies.get(ONBOARDED_COOKIE)?.value;
    const approvedCookie = request.cookies.get(APPROVED_COOKIE)?.value;

    if (onboardedCookie === "1" && approvedCookie === "1") {
      isOnboarded = true;
      isApproved = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_onboarded, last_seen_at, approval_status")
        .eq("id", user.id)
        .maybeSingle();

      isOnboarded = profile?.is_onboarded ?? false;
      isApproved = profile?.approval_status === "approved";

      if (isOnboarded) {
        supabaseResponse.cookies.set(ONBOARDED_COOKIE, "1", {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
      }

      if (isApproved) {
        supabaseResponse.cookies.set(APPROVED_COOKIE, "1", {
          path: "/",
          maxAge: APPROVED_COOKIE_TTL,
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
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", user.id);

      supabaseResponse.cookies.set(LAST_SEEN_COOKIE, now.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
  }

  return { supabaseResponse, user, isOnboarded, isApproved };
}
