import { test, expect } from "@playwright/test";
import { loginWithPassword } from "../helpers/auth";

test.describe("Auth flow (NOT approved + onboarded user)", () => {

  test("lands on pending approval page", async ({ page }) => {
    test.setTimeout(60_000);

    const email = process.env.PW_E2E_UNAPPROVED_ONBOARDED_EMAIL ?? process.env.PW_E2E_UNAPPROVED_ONBOARDED_EMAIL;
    const password = process.env.PW_E2E_UNAPPROVED_ONBOARDED_PASSWORD ?? process.env.PW_E2E_UNAPPROVED_ONBOARDED_PASSWORD;

    test.skip(
      !email || !password,
      "Set PW_E2E_UNAPPROVED_ONBOARDED_EMAIL/PW_E2E_UNAPPROVED_ONBOARDED_PASSWORD to run this test."
    );

    await loginWithPassword(page, {
      email: email!,
      password: password!,
    });

    // Flow expectation: unapproved + onboarded users land on pending approval page.
    const url = page.url();
    if (!/\/pending-approval(?:\?|$)/.test(url)) {
      throw new Error(
        `Expected user to land on /pending-approval, but landed on ${url}. ` +
          "Use an unapproved + onboarded test user for this spec."
      );
    }

    // Then the pending approval page should render as authenticated.
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({
      timeout: 5_000,
    });

    await expect(page.getByRole("heading", { name: "Membership pending approval" })).toBeVisible({
      timeout: 5_000,
    });

    
  });
});