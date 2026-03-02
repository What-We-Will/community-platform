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

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export async function proxy(request: NextRequest) {
  let response: NextResponse;
  let user: { id: string } | null = null;
  let isOnboarded = false;

  try {
    const result = await updateSession(request);
    response = result.supabaseResponse;
    user = result.user;
    isOnboarded = result.isOnboarded;
  } catch (err) {
    console.error("[proxy] Error:", err);
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;

  // Unauthenticated users on auth pages — allow through (prevents redirect loop)
  if (isAuthPath(pathname) && !user) {
    return response;
  }

  // Unauthenticated users on protected routes → login
  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users on auth pages → dashboard
  if (isAuthPath(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Authenticated but not yet onboarded → force onboarding
  // Allow /onboarding itself through to prevent an infinite redirect loop.
  if (user && !isOnboarded && isProtectedPath(pathname) && !isOnboardingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Onboarded users who navigate to /onboarding → send to dashboard
  if (user && isOnboarded && isOnboardingPath(pathname)) {
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
