import { test, expect } from "@playwright/test";
import { loginWithPassword, requireE2ECredentials } from "../fixtures/auth";

test.describe("Auth: unapproved + onboarded user", () => {
  test("lands on pending-approval page", async ({ page }) => {
    const creds = requireE2ECredentials("UNAPPROVED_ONBOARDED");
    await loginWithPassword(page, creds);

    await expect(page).toHaveURL(/\/pending-approval/);
    await expect(
      page.getByRole("heading", { name: "Membership pending approval" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});