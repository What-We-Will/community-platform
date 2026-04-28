import { test, expect } from "@playwright/test";

// NOTE: Don't run these tests in a fast loop because Supabase will
// rate-limit failed auth attempts (~30 requests in an hour)
test.describe("Auth: invalid credentials", () => {
  test("stays on login page with error message", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("WrongPassword123!");

    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid login credentials")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("landing page remains unauthenticated after failed login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid login credentials")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  });
});