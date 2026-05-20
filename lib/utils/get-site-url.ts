/**
 * Canonical public marketing origin (sitemap, OG, JSON-LD, canonical URLs).
 * Logged-in app may also run at members.wwwrise.org — set NEXT_PUBLIC_SITE_URL per deploy.
 */
export const DEFAULT_SITE_URL = "https://wwwrise.org";

/**
 * Server/build-time site URL (no `window`). Used for metadataBase, sitemap, JSON-LD.
 */
export function getServerSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return DEFAULT_SITE_URL;
}

/**
 * Returns the site URL with a clear fallback chain:
 * - Client: window.location.origin
 * - Server: NEXT_PUBLIC_SITE_URL → https://${VERCEL_URL} → DEFAULT_SITE_URL
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return getServerSiteUrl();
}
