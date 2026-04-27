import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../fixtures/auth";

test.describe("Auth: unapproved + onboarded user", () => {
  const email = process.env.PW_E2E_UNAPPROVED_ONBOARDED_EMAIL;
  const password = process.env.PW_E2E_UNAPPROVED_ONBOARDED_PASSWORD;

  test("lands on pending-approval page", async ({ page }) => {
    test.skip(!email || !password, "PW_E2E_UNAPPROVED_ONBOARDED_* env vars required");

    await loginWithPassword(page, { email: email!, password: password! });

    await expect(page).toHaveURL(/\/pending-approval/);
    await expect(
      page.getByRole("heading", { name: "Membership pending approval" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});