import { expect, type Page } from "@playwright/test";

type LoginWithPasswordParams = {
  email: string;
  password: string;
  redirectTo?: string;
};

export async function loginWithPassword(
  page: Page,
  { email, password, redirectTo = "/dashboard" }: LoginWithPasswordParams
) {
  const redirectParam = encodeURIComponent(redirectTo);
  await page.goto(`/login?redirect=${redirectParam}`);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const loginError = page
    .getByText(/invalid login credentials|unexpected error/i)
    .first();

  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in" }).click();

  const outcome = await Promise.race([
    page
      .waitForURL((url) => url.pathname !== "/login", {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      })
      .then(() => "navigated" as const),
    loginError.waitFor({ state: "visible", timeout: 60_000 }).then(() => "error" as const),
  ]);

  if (outcome === "error") {
    const message = (await loginError.textContent())?.trim() ?? "Unknown error";
    throw new Error(`Login failed: ${message}`);
  }

  await expect(page).toHaveURL(/\/(dashboard|onboarding|pending-approval)(?:\?|$)/, {
    timeout: 10_000,
  });
}

