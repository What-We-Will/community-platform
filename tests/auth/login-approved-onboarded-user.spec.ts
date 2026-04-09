import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../helpers/auth";

test.describe("Auth flow (approved + onboarded user)", () => {

  test("lands on dashboard, then home shows logged-in nav", async ({ page }) => {
    test.setTimeout(60_000);

    const email = process.env.PW_E2E_APPROVED_ONBOARDED_EMAIL ?? process.env.PW_E2E_APPROVED_ONBOARDED_EMAIL;
    const password = process.env.PW_E2E_APPROVED_ONBOARDED_PASSWORD ?? process.env.PW_E2E_APPROVED_ONBOARDED_PASSWORD;

    test.skip(
      !email || !password,
      "Set PW_E2E_APPROVED_ONBOARDED_E2E_APPROVED_EMAIL/PW_E2E_APPROVED_ONBOARDED_E2E_APPROVED_PASSWORD (or PW_E2E_APPROVED_ONBOARDED_E2E_EMAIL/PW_E2E_APPROVED_ONBOARDED_E2E_PASSWORD) to run this test."
    );

    await loginWithPassword(page, {
      email: email!,
      password: password!,
      redirectTo: "/dashboard",
    });

    // Flow 3 expectation: approved + onboarded users land on dashboard.
    const url = page.url();
    if (!/\/dashboard(?:\?|$)/.test(url)) {
      throw new Error(
        `Expected flow 3 user to land on /dashboard, but landed on ${url}. ` +
          "Use an approved + onboarded test user for this spec."
      );
    }

    // Then the landing page should render as authenticated.
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Login" })).toHaveCount(0);
  });
});

