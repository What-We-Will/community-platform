import { test, expect } from "@playwright/test";
import { loginWithPassword, requireE2ECredentials } from "../fixtures/auth";

test.describe("Auth: approved + onboarded user", () => {
  test("lands on dashboard with authenticated nav", async ({ page }) => {
    const creds = requireE2ECredentials("APPROVED_ONBOARDED");
    await loginWithPassword(page, creds);

    await expect(page).toHaveURL(/\/dashboard/);

    // Sidebar nav proves authenticated + approved state
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Messages" })).toBeVisible();
  });

  test("landing page shows authenticated nav after login", async ({ page }) => {
    const creds = requireE2ECredentials("APPROVED_ONBOARDED");
    await loginWithPassword(page, creds);
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toHaveCount(0);
  });
});