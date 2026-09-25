/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

function buildIngestRequest(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
): NextRequest {
  return new NextRequest(`https://community.example.org${url}`, {
    method: init?.method ?? "GET",
    headers: init?.headers,
    body: init?.body,
  });
}

describe("PostHog ingest proxy — the outbound request is built fresh, never relayed", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("should never forward the cookie header when the browser attaches session cookies", async () => {
    const request = buildIngestRequest("/ingest/e/", {
      method: "POST",
      headers: {
        cookie: "sb-project-auth-token=secret; profile_approved=1",
        "content-type": "application/json",
      },
      body: '{"event":"$pageview"}',
    });

    await POST(request);

    const [, init] = fetchSpy.mock.calls[0];
    expect(new Headers(init?.headers).get("cookie")).toBeNull();
  });

  it("should forward only content-type and user-agent when other headers are present", async () => {
    const request = buildIngestRequest("/ingest/e/", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "user-agent": "TestBrowser/1.0",
        authorization: "Bearer member-jwt",
        "x-forwarded-for": "203.0.113.7",
      },
      body: "payload",
    });

    await POST(request);

    const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers);
    expect(headers.get("content-type")).toBe("text/plain");
    expect(headers.get("user-agent")).toBe("TestBrowser/1.0");
    expect(headers.get("authorization")).toBeNull();
    expect(headers.get("x-forwarded-for")).toBeNull();
  });

  it("should preserve the path, trailing slash, and query string toward the ingest host", async () => {
    const request = buildIngestRequest("/ingest/e/?ip=0&compression=gzip-js", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "payload",
    });

    await POST(request);

    expect(String(fetchSpy.mock.calls[0][0])).toBe(
      "https://us.i.posthog.com/e/?ip=0&compression=gzip-js"
    );
  });

  it("should route static and array asset paths to the assets host", async () => {
    await GET(buildIngestRequest("/ingest/static/recorder.js"));
    await GET(buildIngestRequest("/ingest/array/token123/config.js"));

    expect(String(fetchSpy.mock.calls[0][0])).toBe(
      "https://us-assets.i.posthog.com/static/recorder.js"
    );
    expect(String(fetchSpy.mock.calls[1][0])).toBe(
      "https://us-assets.i.posthog.com/array/token123/config.js"
    );
  });

  it("should pass the POST body through unchanged when capturing events", async () => {
    const body = '{"event":"$pageview","properties":{}}';
    const request = buildIngestRequest("/ingest/e/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    await POST(request);

    const forwarded = fetchSpy.mock.calls[0][1]?.body as ArrayBuffer;
    expect(new TextDecoder().decode(forwarded)).toBe(body);
  });

  it("should return the upstream status and body without leaking upstream set-cookie headers", async () => {
    fetchSpy.mockResolvedValue(
      new Response('{"status":1}', {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": "ph_upstream=1",
        },
      })
    );

    const response = await GET(buildIngestRequest("/ingest/flags/?v=2"));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"status":1}');
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
