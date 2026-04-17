import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../fixtures/auth";

test.describe("Auth: approved + onboarded user", () => {
  const email = process.env.PW_E2E_APPROVED_ONBOARDED_EMAIL;
  const password = process.env.PW_E2E_APPROVED_ONBOARDED_PASSWORD;

  test("lands on dashboard with authenticated nav", async ({ page }) => {
    test.skip(!email || !password, "PW_E2E_APPROVED_ONBOARDED_* env vars required");

    await loginWithPassword(page, { email: email!, password: password! });

    await expect(page).toHaveURL(/\/dashboard/);

    // Sidebar nav proves authenticated + approved state
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Messages" })).toBeVisible();
  });

  test("landing page shows authenticated nav after login", async ({ page }) => {
    test.skip(!email || !password, "PW_E2E_APPROVED_ONBOARDED_* env vars required");

    await loginWithPassword(page, { email: email!, password: password! });
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toHaveCount(0);
  });
});
