import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/members",
  "/messages",
  "/groups",
  "/events",
  "/jobs",
  "/referrals",
  "/compare",
  "/learn",
  "/recordings",
  "/schedule",
  "/onboarding",
];

const AUTH_ROUTES = ["/login", "/signup"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  let response: NextResponse;
  let user: { id: string } | null = null;

  try {
    const result = await updateSession(request);
    response = result.supabaseResponse;
    user = result.user;
  } catch (err) {
    console.error("[proxy] Error:", err);
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;

  // Unauthenticated users on auth pages — never redirect (prevents auth loop)
  if (isAuthPath(pathname) && !user) {
    return response;
  }

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
