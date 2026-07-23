/**
 * @vitest-environment node
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// vi.hoisted so the vi.mock factory and the tests close over the same spies.
const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { createTransport: vi.fn(() => ({ sendMail })), sendMail };
});
vi.mock("nodemailer", () => ({ default: { createTransport } }));

import type { MockedFunction } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

const mockCreateClient = createClient as MockedFunction<typeof createClient>;

const validInput = {
  display_name: "Jane Doe",
  skills: ["TypeScript"],
  open_to_referrals: true,
  linkedin_url: "https://linkedin.com/in/jane",
};

function mockAuthedClient() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "jane@example.com" } },
      }),
    },
    from: vi.fn().mockReturnValue({ upsert }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

function configureSmtp() {
  vi.stubEnv("GMAIL_USER", "bot@example.com");
  vi.stubEnv("GMAIL_APP_PASSWORD", "app-pass-123");
  vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
}

// Asserts on the { subject, html } envelope handed to sendMail rather than its
// exact format, so the controls survive a future rebuild of the body (e.g.
// React email templates). display_name is the user-controlled free-text field
// that reaches both the subject header and the HTML body unvalidated.
describe("completeOnboarding — admin notification neutralizes hostile display names", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSmtp();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should strip CR/LF from the subject when the display name carries a header injection", async () => {
    mockAuthedClient();

    await completeOnboarding({
      ...validInput,
      display_name: "Jane\r\nBcc: victim@example.com",
    });

    expect(sendMail).toHaveBeenCalledTimes(1);
    // CR/LF removal is the control; the leftover "Bcc:" text is inert without
    // a line break, so don't assert on its absence.
    const { subject } = sendMail.mock.calls[0][0];
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("should HTML-escape the body when the display name contains markup", async () => {
    mockAuthedClient();

    await completeOnboarding({
      ...validInput,
      display_name: "<script>alert(1)</script>",
    });

    const { html } = sendMail.mock.calls[0][0];
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("should escape quotes in the body when the display name tries to break out of an attribute", async () => {
    mockAuthedClient();

    await completeOnboarding({
      ...validInput,
      display_name: 'Jane" onmouseover="alert(1)',
    });

    const { html } = sendMail.mock.calls[0][0];
    expect(html).not.toContain('" onmouseover="');
    expect(html).toContain("&quot;");
  });

  it("should not send the notification when SMTP env vars are absent", async () => {
    vi.stubEnv("GMAIL_USER", "");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    vi.stubEnv("ADMIN_EMAIL", "");
    mockAuthedClient();

    const result = await completeOnboarding(validInput);

    expect(result).toEqual({});
    expect(sendMail).not.toHaveBeenCalled();
  });
});
