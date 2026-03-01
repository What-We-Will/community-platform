import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        .single();

      const redirectPath = profile?.is_onboarded ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    }
  }

  // Redirect to login on error; to dashboard if no code (e.g. already logged in)
  const fallbackPath = code ? "/login" : "/dashboard";
  return NextResponse.redirect(new URL(fallbackPath, requestUrl.origin));
}
