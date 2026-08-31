/**
 * @vitest-environment node
 */
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("PostHog ingest proxy — upstream fetch can never leave the PostHog hosts", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("should reject with 400 and not fetch when the path remainder is protocol-relative", async () => {
    const request = new NextRequest(
      "https://community.example.org/ingest//example.com/x"
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should reject with 400 and not fetch when backslashes normalize to a foreign host", async () => {
    const request = new NextRequest(
      "https://community.example.org/ingest/\\example.com/x",
      { method: "POST", body: "payload" }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
