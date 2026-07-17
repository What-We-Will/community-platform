/**
 * @vitest-environment node
 *
 * Validation and outbound-email envelope for the bug report route.
 * Persistence (bug_reports insert) and best-effort insert/email
 * combinations are covered in route.persistence.test.ts.
 */

// Force module scope so this file's top-level declarations don't collide
// with route.persistence.test.ts's identically-named ones under tsc.
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

const { mockInsert } = vi.hoisted(() => ({ mockInsert: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({ from: vi.fn(() => ({ insert: mockInsert })) })),
}));

const VALID_ENV = {
  GMAIL_USER: "bot@example.com",
  GMAIL_APP_PASSWORD: "app-pass-123",
  ADMIN_EMAIL: "admin@example.com",
} as const;

function makeRequest(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request("https://app.example.com/api/bug-report", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
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
  steps: "1. open profile  2. click save",
};

describe("POST /api/bug-report — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [key, value] of Object.entries(VALID_ENV)) vi.stubEnv(key, value);
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("should return 400 and send nothing when the description is missing", async () => {
    const post = await loadPost();
    const response = await post(makeRequest({ email: validReport.email }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Description is required." });
    expect(sendMail).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("should return 400 when the description exceeds the length cap", async () => {
    const post = await loadPost();
    const response = await post(
      makeRequest({ email: validReport.email, description: "x".repeat(5001) }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Description is too long." });
  });

  it("should return 400 when the anonymous reporter's email is missing", async () => {
    const post = await loadPost();
    const response = await post(makeRequest({ description: validReport.description }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Email is required." });
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("POST /api/bug-report — outbound email envelope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const [key, value] of Object.entries(VALID_ENV)) vi.stubEnv(key, value);
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("should send the report to the admin address with the expected envelope", async () => {
    const post = await loadPost();
    const response = await post(
      makeRequest(validReport, { referer: "https://app.example.com/profile" }),
    );
    expect(response.status).toBe(200);
    const mail = sendMail.mock.calls[0][0];
    expect(mail).toMatchObject({
      to: "admin@example.com",
      from: expect.stringContaining("bot@example.com"),
      replyTo: "reporter@example.com",
      subject: expect.stringContaining("reporter@example.com"),
    });
    expect(mail.html).toContain("The save button does nothing");
    expect(mail.html).toContain("1. open profile");
    expect(mail.html).toContain("https://app.example.com/profile");
  });

  it("should omit the steps section from the email when no steps are provided", async () => {
    const post = await loadPost();
    await post(makeRequest({ email: validReport.email, description: validReport.description }));
    const mail = sendMail.mock.calls[0][0];
    expect(mail.html).not.toContain("Steps to Reproduce");
  });

  it("should fall back to an unknown page label when the referer header is absent", async () => {
    const post = await loadPost();
    await post(makeRequest(validReport));
    expect(sendMail.mock.calls[0][0].html).toContain("unknown");
  });

  it("should escape HTML in reporter-supplied text so markup can't be injected", async () => {
    const post = await loadPost();
    await post(makeRequest({ email: validReport.email, description: "<b>x</b>" }));
    const html = sendMail.mock.calls[0][0].html;
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });
});
