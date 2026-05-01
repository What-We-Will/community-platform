import {
  MY_TOOLS_REMINDER_COOLDOWN_DAYS,
  canSendReminderEmail,
} from "./my-tools-reminder-schedule";

describe("canSendReminderEmail", () => {
  const now = new Date("2025-06-15T12:00:00.000Z");

  it("allows send when never sent", () => {
    expect(canSendReminderEmail(null, now, MY_TOOLS_REMINDER_COOLDOWN_DAYS)).toBe(
      true
    );
  });

  it("blocks send within cooldown window", () => {
    const recent = new Date("2025-06-14T12:00:00.000Z").toISOString();
    expect(canSendReminderEmail(recent, now, MY_TOOLS_REMINDER_COOLDOWN_DAYS)).toBe(
      false
    );
  });

  it("allows send after cooldown window", () => {
    const old = new Date("2025-06-01T12:00:00.000Z").toISOString();
    expect(canSendReminderEmail(old, now, MY_TOOLS_REMINDER_COOLDOWN_DAYS)).toBe(
      true
    );
  });

  it("respects custom cooldown days", () => {
    const threeDaysAgo = new Date("2025-06-12T12:00:00.000Z").toISOString();
    expect(canSendReminderEmail(threeDaysAgo, now, 2)).toBe(true);
    expect(canSendReminderEmail(threeDaysAgo, now, 5)).toBe(false);
  });
});
