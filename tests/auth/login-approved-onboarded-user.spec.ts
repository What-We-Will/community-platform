import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../helpers/auth";

test.describe("Auth flow (approved + onboarded user)", () => {

  test("lands on dashboard, then home shows logged-in nav", async ({ page }) => {
    test.setTimeout(60_000);

    const email = process.env.PW_E2E_APPROVED_ONBOARDED_EMAIL ?? process.env.PW_E2E_APPROVED_ONBOARDED_EMAIL;
    const password = process.env.PW_E2E_APPROVED_ONBOARDED_PASSWORD ?? process.env.PW_E2E_APPROVED_ONBOARDED_PASSWORD;

    test.skip(
      !email || !password,
      "Set PW_E2E_APPROVED_ONBOARDED_EMAIL/PW_E2E_APPROVED_ONBOARDED_PASSWORD to run this test."
    );

    await loginWithPassword(page, {
      email: email!,
      password: password!,
    });

    // Flow expectation: approved + onboarded users land on dashboard.
    const url = page.url();
    if (!/\/dashboard(?:\?|$)/.test(url)) {
      throw new Error(
        `Expected flow 3 user to land on /dashboard, but landed on ${url}. ` +
        "Use an approved + onboarded test user for this spec."
      );
    }

    //Check dashboard 

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Events" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Groups" }).nth(0)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Messages" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Members" }).nth(0)).toBeVisible({
      timeout: 5_000,
    });

    await expect(page.locator('p', { hasText: 'My Tools' })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Job Application Tracker" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Learning Tracker" })).toBeVisible({
      timeout: 5_000,
    });

    await expect(page.locator('p', { hasText: 'Resources' })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Job Board" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Group Learning" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Resource Hub" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "TWC Slack" })).toBeVisible({
      timeout: 5_000,
    });

    await expect(page.getByRole("link", { name: "My Profile" })).toBeVisible({
      timeout: 5_000,
    });

    await expect(page.locator('p', { hasText: 'Approved User' }).nth(0)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('p', { hasText: email })).toBeVisible({
      timeout: 5_000,
    });

    // Then the landing page should render as authenticated.
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.getByRole("link", { name: "Donate", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toHaveCount(0);
  });
});

