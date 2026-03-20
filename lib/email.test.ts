import { sendMyToolsReminderEmail } from "./email";

describe("sendMyToolsReminderEmail", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns mail_not_configured when Gmail is not set up", async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    const result = await sendMyToolsReminderEmail({
      to: "u@example.com",
      displayName: "Test User",
      myToolsUrl: "https://example.com/my-tools",
      profileUrl: "https://example.com/profile",
      tips: ["Add your headline."],
    });
    expect(result).toEqual({ ok: false, reason: "mail_not_configured" });
  });
});
