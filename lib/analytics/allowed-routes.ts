/**
 * Analytics capture scope is an ALLOWLIST of authenticated `(app)` surfaces.
 * Everything else — auth, recovery, onboarding, pending-approval, the public
 * marketing site — emits nothing. Never convert this to a deny-list and never
 * add a public route: capture scope changes require an ADR amendment
 * (see docs/adr/0013-posthog-product-analytics.md).
 */
export const CAPTURABLE_ROUTE_PREFIXES = [
  "/dashboard",
  "/events",
  "/groups",
  "/jobs",
  "/learning",
  "/links",
  "/members",
  "/messages",
  "/profile",
  "/projects",
  "/tracker",
] as const;

export function isCapturablePath(pathname: string): boolean {
  return CAPTURABLE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
