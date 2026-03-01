import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const LAST_SEEN_COOKIE = "last_seen";
const LAST_SEEN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      supabaseResponse: NextResponse.next({ request }),
      user: null,
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

  // Update last_seen_at if user is authenticated and cookie is stale
  if (user) {
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
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }
  }

  return { supabaseResponse, user };
}
