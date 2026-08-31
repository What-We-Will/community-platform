import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined),
  },
  // PostHog sends trailing-slash-sensitive paths (/ingest/e/); without this,
  // Next's trailing-slash redirect breaks ingest requests before they reach
  // app/ingest/[...path]/route.ts, which proxies them with a header allowlist
  // so cookies never reach PostHog.
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },
      {
        source: "/mass-call",
        destination: "https://movement.wwwrise.org",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
