import { test, expect } from "@playwright/test";

test.describe("Auth flow invalid user can't log in", () => {

  test("Invalid user can't login", async ({ page }) => {
    test.setTimeout(60_000);

    const email = "NonExistentUser@example.com";
    const password = "SomeRandomPassword123!";

    await page.goto(`/login`);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);

    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
    await page.getByRole("button", { name: "Sign in" }).click();


    // Flow expectation: invalid user stays on login page and sees error message about invalid credentials.
    const url = page.url();
    if (!/\/login(?:\?|$)/.test(url)) {
      throw new Error(
        `Expected user to stay on login page, but landed on ${url}. ` +
        "Use an invalid test user for this spec."
      );
    }

    await expect(page.getByText('Invalid login credentials')).toBeVisible({
      timeout: 5_000,
    });

    // Then the landing page should render as unauthenticated.
    await page.goto("/");

    await expect(page.getByAltText("What We Will logo")).toBeVisible();
    await expect(page.getByRole("link", { name: "About Us" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Our Platform" })).toBeVisible();
    await expect(page.getByRole("link", { name: "News" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    // No dashboard link in nav, but donate
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