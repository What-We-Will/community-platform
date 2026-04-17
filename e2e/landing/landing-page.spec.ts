import { test, expect } from "@playwright/test";

test.describe("Landing page (anonymous)", () => {
  test("shows public nav and signup CTA", async ({ page }) => {
    await page.goto("/");

    // Public nav links visible
    await expect(page.getByRole("link", { name: "About Us" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Our Platform" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Donate", exact: true })
    ).toBeVisible();

    // No authenticated UI
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);

    // Hero CTA
    await expect(
      page.getByRole("link", { name: "Join the Community" })
    ).toBeVisible();
  });
});
