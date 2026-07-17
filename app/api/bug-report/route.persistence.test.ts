/**
 * @vitest-environment node
 *
 * Persistence and best-effort insert/email combinations for the bug report
 * route. Validation and the outbound-email envelope are covered in
 * route.test.ts.
 */

// Force module scope so this file's top-level declarations don't collide
// with route.test.ts's identically-named ones under tsc.
export {};

const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { createTransport: vi.fn(() => ({ sendMail })), sendMail };
});
vi.mock("nodemailer", () => ({ default: { createTransport } }));

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ auth: { getUser: mockGetUser } }),
}));

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  return { mockInsert, mockFrom };
});
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

const VALID_ENV = {
  GMAIL_USER: "bot@example.com",
  GMAIL_APP_PASSWORD: "app-pass-123",
  ADMIN_EMAIL: "admin@example.com",
} as const;

function makeRequest(body: Record<string, unknown>) {
  return new Request("https://app.example.com/api/bug-report", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The route reads env at module load, so re-import after stubbing to pick it up.
async function loadPost() {
  vi.resetModules();
  return (await import("./route")).POST;
}

const validReport = {
  email: "reporter@example.com",
  description: "The save button does nothing",
  steps: "steps here",
};

describe("POST /api/bug-report — persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [key, value] of Object.entries(VALID_ENV)) vi.stubEnv(key, value);
    mockInsert.mockResolvedValue({ error: null });
    sendMail.mockResolvedValue(undefined);
  });

  it("should insert with the session user's id when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
    });
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("bug_reports");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ reporter_id: "user-1", reporter_email: null }),
    );
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("should insert with the submitted email when anonymous", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ reporter_id: null, reporter_email: "reporter@example.com" }),
    );
  });

  it("should still return success when the email fails but the insert succeeds", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("should still return success when the insert fails but the email succeeds", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockInsert.mockResolvedValue({ error: { message: "insert failed" } });
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("should return 500 when both the insert and the email fail", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockInsert.mockResolvedValue({ error: { message: "insert failed" } });
    sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Something went wrong." });
  });
});
