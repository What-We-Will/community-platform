const PRODUCTION_URL = "https://members.wwwrise.org";

/**
 * Returns the site URL with a clear fallback chain:
 * - Server: NEXT_PUBLIC_SITE_URL → https://${VERCEL_URL} → production URL
 * - Client: NEXT_PUBLIC_SITE_URL → window.location.origin
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return PRODUCTION_URL;
}
