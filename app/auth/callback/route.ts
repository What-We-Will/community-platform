import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in Server Component context
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Fetch profile to check onboarding status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", data.user.id)
        .maybeSingle();

      // Use "next" param if valid relative path, otherwise use onboarding/dashboard
      let redirectPath = profile?.is_onboarded ? "/dashboard" : "/onboarding";
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        redirectPath = next;
      }
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    }
  }

  // Redirect to login on error; to dashboard if no code (e.g. already logged in)
  const fallbackPath = code ? "/login" : next && next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(new URL(fallbackPath, requestUrl.origin));
}
