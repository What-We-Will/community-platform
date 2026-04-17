import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../fixtures/auth";

test.describe("Auth: unonboarded user", () => {
  const email = process.env.PW_E2E_UNONBOARDED_EMAIL;
  const password = process.env.PW_E2E_UNONBOARDED_PASSWORD;

  test("lands on onboarding page", async ({ page }) => {
    test.skip(!email || !password, "PW_E2E_UNONBOARDED_* env vars required");

    await loginWithPassword(page, { email: email!, password: password! });

    await expect(page).toHaveURL(/\/onboarding/);
    await expect(
      page.getByRole("heading", { name: "Complete your profile" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Complete Profile" })
    ).toBeVisible();
  });
});
