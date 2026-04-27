import { expect, test, type Page } from "@playwright/test";

type LoginParams = {
  email: string;
  password: string;
};

type CredentialKey =
  | "APPROVED_ONBOARDED"
  | "UNAPPROVED_ONBOARDED"
  | "UNONBOARDED";

/**
 * Reads a PW_E2E_<KEY>_EMAIL / _PASSWORD pair from the environment.
 * If either is missing, skips the current test with a message naming
 * the missing var and pointing the contributor to the setup docs.
 */
export function requireE2ECredentials(key: CredentialKey): LoginParams {
  const email = process.env[`PW_E2E_${key}_EMAIL`];
  const password = process.env[`PW_E2E_${key}_PASSWORD`];

  test.skip(
    !email || !password,
    `Missing PW_E2E_${key}_EMAIL or PW_E2E_${key}_PASSWORD in .env.e2e — see e2e/README.md for setup.`
  );

  return { email: email!, password: password! };
}

/**
 * Logs in via the password form and waits for navigation away from /login.
 * Throws on credential errors so the calling test gets a clear failure message.
 */
export async function loginWithPassword(
  page: Page,
  { email, password }: LoginParams
) {
  await page.goto("/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in" }).click();

  // Race: either we navigate away from /login, or an error message appears.
  const loginError = page
    .getByText(/invalid login credentials|unexpected error/i)
    .first();

  const outcome = await Promise.race([
    page
      .waitForURL((url) => url.pathname !== "/login", {
        timeout: 30_000,
        waitUntil: "domcontentloaded",
      })
      .then(() => "navigated" as const),
    loginError
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "error" as const),
  ]);

  if (outcome === "error") {
    const message = (await loginError.textContent())?.trim() ?? "Unknown error";
    throw new Error(`Login failed: ${message}`);
  }

  // Confirm we landed on one of the expected post-login routes.
  await expect(page).toHaveURL(
    /\/(dashboard|onboarding|pending-approval)(?:\?|$)/,
    { timeout: 10_000 }
  );
}
