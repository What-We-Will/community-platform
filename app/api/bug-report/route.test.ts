/**
 * @vitest-environment node
 *
 * Regression guard for the nodemailer transport contract. The route's
 * observable side effect is the outbound admin email, so we mock the SMTP
 * boundary (analogous to fetch) and assert on the envelope it receives — not
 * on internal call order. This pins the createTransport/sendMail interface so a
 * future nodemailer bump that changes how we must call it fails here loudly.
 */

// Hoisted so the vi.mock factory can close over the same spies the tests assert on.
const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { createTransport: vi.fn(() => ({ sendMail })), sendMail };
});

vi.mock("nodemailer", () => ({ default: { createTransport } }));

const VALID_ENV = {
  GMAIL_USER: "bot@example.com",
  GMAIL_APP_PASSWORD: "app-pass-123",
  ADMIN_EMAIL: "admin@example.com",
} as const;

function stubEnv(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
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

describe("POST /api/bug-report — emails the admin a submitted bug report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubEnv(VALID_ENV);
  });

  it("should send the report to the admin address and return success when input is valid", async () => {
    const post = await loadPost();

    const response = await post(
      makeRequest(validReport, { referer: "https://app.example.com/profile" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledTimes(1);
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

  it("should configure the transport with the gmail service and app-password credentials", async () => {
    const post = await loadPost();

    await post(makeRequest(validReport));

    expect(createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: "bot@example.com", pass: "app-pass-123" },
    });
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

  it("should return 400 and send nothing when the description is missing", async () => {
    const post = await loadPost();

    const response = await post(makeRequest({ email: validReport.email }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Description is required." });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("should return 400 and send nothing when the reporter email is missing", async () => {
    const post = await loadPost();

    const response = await post(makeRequest({ description: validReport.description }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Email is required." });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("should return 503 and send nothing when SMTP credentials are not configured", async () => {
    stubEnv({ GMAIL_USER: "", GMAIL_APP_PASSWORD: "", ADMIN_EMAIL: "" });
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Bug reporting is not configured on this server.",
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("should return 500 when the mail transport rejects", async () => {
    sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));
    const post = await loadPost();

    const response = await post(makeRequest(validReport));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Something went wrong." });
  });
});
