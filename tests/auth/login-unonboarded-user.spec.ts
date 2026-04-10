import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../helpers/auth";

test.describe("Auth flow (unapproved + NOT onboarded user)", () => {

  test("lands on onboarding page", async ({ page }) => {
    test.setTimeout(60_000);

    const email = process.env.PW_E2E_UNONBOARDED_EMAIL ?? process.env.PW_E2E_UNONBOARDED_EMAIL;
    const password = process.env.PW_E2E_UNONBOARDED_PASSWORD ?? process.env.PW_E2E_UNONBOARDED_PASSWORD;

    test.skip(
      !email || !password,
      "Set PW_E2E_UNONBOARDED_PASSWORD/PW_E2E_UNONBOARDED_PASSWORD to run this test."
    );

    await loginWithPassword(page, {
      email: email!,
      password: password!,
    });

    // Flow expectation: unapproved + NOT onboarded users land on onboarding page.
    const url = page.url();
    if (!/\/onboarding(?:\?|$)/.test(url)) {
      throw new Error(
        `Expected user to land on /onboarding, but landed on ${url}. ` +
          "Use an unapproved + NOT onboarded test user for this spec."
      );
    }

    // Then the onbaording page should render correctly.
    await expect(page.getByRole("heading", { name: "Complete your profile" })).toBeVisible({
      timeout: 5_000,
    });

    await expect(page.getByRole("button", { name: "Complete Profile" })).toBeVisible({
      timeout: 5_000,
    });

    
  });
});