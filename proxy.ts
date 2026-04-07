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
  "/pending-approval",
  "/admin",
  "/projects",
  "/links",
  "/learning",
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

function isPendingApprovalPath(pathname: string): boolean {
  return pathname === "/pending-approval" || pathname.startsWith("/pending-approval/");
}

export async function proxy(request: NextRequest) {
  /**
   * Supabase OAuth (PKCE) must hit /auth/callback to exchange ?code= for a session.
   * If Redirect URLs or Site URL point at the site root, the provider returns to
   * /?code=... Forward those requests to the callback route (preserve query params).
   */
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (
    code &&
    pathname !== "/auth/callback" &&
    !pathname.startsWith("/auth/callback/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  let response: NextResponse;
  let user: { id: string } | null = null;
  let isOnboarded = false;
  let isApproved = false;

  try {
    const result = await updateSession(request);
    response = result.supabaseResponse;
    user = result.user;
    isOnboarded = result.isOnboarded;
    isApproved = result.isApproved;
  } catch (err) {
    console.error("[proxy] Error:", err);
    return NextResponse.next({ request });
  }

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

  // Authenticated users on auth pages → appropriate destination
  if (isAuthPath(pathname) && user) {
    const url = request.nextUrl.clone();
    if (!isOnboarded) {
      url.pathname = "/onboarding";
    } else if (!isApproved) {
      url.pathname = "/pending-approval";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Authenticated but not yet onboarded → force onboarding
  if (user && !isOnboarded && isProtectedPath(pathname) && !isOnboardingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Onboarded but pending approval → hold at /pending-approval
  if (user && isOnboarded && !isApproved && isProtectedPath(pathname) && !isPendingApprovalPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/pending-approval";
    return NextResponse.redirect(url);
  }

  // Onboarded users who navigate to /onboarding → send to appropriate destination
  if (user && isOnboarded && isOnboardingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = isApproved ? "/dashboard" : "/pending-approval";
    return NextResponse.redirect(url);
  }

  // Approved users who navigate to /pending-approval → send to dashboard
  if (user && isOnboarded && isApproved && isPendingApprovalPath(pathname)) {
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
