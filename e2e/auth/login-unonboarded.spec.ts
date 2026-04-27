import { test, expect } from "@playwright/test";
import { loginWithPassword, requireE2ECredentials } from "../fixtures/auth";

test.describe("Auth: unonboarded user", () => {
  test("lands on onboarding page", async ({ page }) => {
    const creds = requireE2ECredentials("UNONBOARDED");
    await loginWithPassword(page, creds);

    await expect(page).toHaveURL(/\/onboarding/);
    await expect(
      page.getByRole("heading", { name: "Complete your profile" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Complete Profile" })
    ).toBeVisible();
  });
});