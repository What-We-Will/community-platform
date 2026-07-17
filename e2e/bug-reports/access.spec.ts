import { test, expect } from "@playwright/test";
import { loginWithPassword, requireE2ECredentials } from "../fixtures/auth";

// This only covers the negative case (non-staff member is redirected away).
// Admin/moderator-sees-list coverage needs an admin E2E fixture that does
// not exist yet — follow-up.
test.describe("Bug reports: access control", () => {
  test("member is redirected away from /bug-reports", async ({ page }) => {
    const creds = requireE2ECredentials("APPROVED_ONBOARDED");
    await loginWithPassword(page, creds);

    await page.goto("/bug-reports");

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
