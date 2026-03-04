import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  // Use a response object as the cookie sink so session cookies are sent with the redirect.
  // (next/headers cookies() may not be merged into a manual NextResponse.redirect() in some runtimes.)
  const cookieSink = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieSink.cookies.set(name, value, options ?? {});
        });
      },
    },
  });

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", data.user.id)
        .maybeSingle();

      let redirectPath = profile?.is_onboarded ? "/dashboard" : "/onboarding";
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        redirectPath = next;
      }
      const redirectUrl = new URL(redirectPath, requestUrl.origin);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      cookieSink.cookies.getAll().forEach(({ name, value, ...rest }) => {
        redirectResponse.cookies.set(name, value, rest);
      });
      return redirectResponse;
    }
  }

  const fallbackPath = code ? "/login" : next && next.startsWith("/") ? next : "/dashboard";
  const redirectResponse = NextResponse.redirect(new URL(fallbackPath, requestUrl.origin));
  cookieSink.cookies.getAll().forEach(({ name, value, ...rest }) => {
    redirectResponse.cookies.set(name, value, rest);
  });
  return redirectResponse;
}
