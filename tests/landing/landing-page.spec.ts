import { test, expect } from "@playwright/test";

test.describe("Landing page (home)", () => {
  test("renders correctly when logged out", async ({ page }) => {
    await page.goto("/");

    // Core nav + CTA
    await expect(page.getByAltText("What We Will logo")).toBeVisible();
    await expect(page.getByRole("link", { name: "About Us" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Our Platform" })).toBeVisible();
    await expect(page.getByRole("link", { name: "News" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Donate", exact: true })
    ).toBeVisible();

    // Main hero area (avoid asserting rotating headline text)
    await expect(
      page.getByRole("link", { name: "Join the Community" })
    ).toBeVisible();
    await expect(
      page.getByAltText("Diverse workers united for just transitions")
    ).toHaveCount(2);
  });
});