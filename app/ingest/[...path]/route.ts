import type { NextRequest } from "next/server";

const ASSET_HOST = "https://us-assets.i.posthog.com";

// Only what PostHog needs to interpret the payload. Everything else — Cookie
// (Supabase session tokens are path=/ and ride every same-origin request),
// Authorization, client IP — stays on our origin. A config-level rewrite
// would relay the full request; this handler exists to prevent exactly that.
// See docs/adr/0013-posthog-product-analytics.md.
const FORWARDED_REQUEST_HEADERS = ["content-type", "user-agent"] as const;
const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control"] as const;

function buildUpstreamUrl(nextUrl: NextRequest["nextUrl"]): URL | null {
  const path = nextUrl.pathname.replace(/^\/ingest/, "");
  const base =
    path.startsWith("/static/") || path.startsWith("/array/")
      ? ASSET_HOST
      : (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com");
  const url = new URL(path, base);
  // A path remainder beginning with "//" (or "\\" — WHATWG treats backslashes
  // as slashes) is protocol-relative and would re-target the fetch at an
  // attacker-chosen host, turning this public endpoint into an open proxy.
  // Validating the constructed URL rather than the input covers every
  // encoding variant.
  if (url.protocol !== "https:" || url.host !== new URL(base).host) {
    return null;
  }
  url.search = nextUrl.search;
  return url;
}

async function forward(request: NextRequest): Promise<Response> {
  const upstreamUrl = buildUpstreamUrl(request.nextUrl);
  if (!upstreamUrl) {
    return new Response("Bad Request", { status: 400 });
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.arrayBuffer() : undefined,
  });

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      responseHeaders.set(name, value);
    }
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  return forward(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return forward(request);
}
