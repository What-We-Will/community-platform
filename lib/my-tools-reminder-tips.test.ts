import { missingFieldToReminderTip } from "./my-tools-reminder-tips";

describe("missingFieldToReminderTip", () => {
  it("maps known missing labels", () => {
    expect(missingFieldToReminderTip("LinkedIn URL")).toBe("Add your LinkedIn URL.");
    expect(missingFieldToReminderTip("Headline")).toBe("Add a professional headline.");
    expect(missingFieldToReminderTip("Bio")).toBe(
      "Add a short career summary to your bio."
    );
    expect(missingFieldToReminderTip("Location")).toBe("Add your location.");
    expect(missingFieldToReminderTip("A longer bio (40+ characters)")).toBe(
      "Expand your bio to at least 40 characters."
    );
  });

  it("lowercases strings starting with At least", () => {
    expect(missingFieldToReminderTip("At least 2 skills")).toBe(
      "Add at least 2 skills."
    );
  });

  it("falls back for unknown labels", () => {
    expect(missingFieldToReminderTip("Custom field")).toBe("Complete: Custom field.");
  });
});
