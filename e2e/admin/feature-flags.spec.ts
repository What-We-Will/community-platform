import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { loginWithPassword, requireE2ECredentials } from "../fixtures/auth";

// The flag cache on other server instances can lag up to 30 seconds.
const PROPAGATION_TIMEOUT = 35_000;

const contexts: BrowserContext[] = [];

async function signedInPage(browser: Browser, key: "ADMIN" | "NONADMIN") {
  const creds = requireE2ECredentials(key);
  const context = await browser.newContext();
  contexts.push(context);
  const page = await context.newPage();
  await loginWithPassword(page, creds);
  return page;
}

function newestChange(admin: Page) {
  // The history list is ordered newest first, so the first item is the latest change.
  return admin.getByRole("region", { name: "Recent changes" }).getByRole("listitem").first();
}

async function newestChangeTime(admin: Page) {
  if ((await newestChange(admin).count()) === 0) return null;
  // <time> has no accessible name; its datetime attribute identifies the row.
  return newestChange(admin).locator("time").getAttribute("datetime");
}

async function setProjectsFlag(admin: Page, on: boolean) {
  await admin.goto("/admin/feature-flags");
  const toggle = admin.getByRole("switch", { name: "Projects", exact: true });
  if ((await toggle.getAttribute("aria-checked")) === String(on)) return;

  await toggle.click();
  if (!on) {
    await admin
      .getByRole("alertdialog", { name: "Turn off Projects?" })
      .getByRole("button", { name: "Turn off" })
      .click();
  }
  await expect(toggle).toHaveAttribute("aria-checked", String(on));
  await expect(admin.getByText("This flag changed since the page loaded", { exact: false })).toHaveCount(0);
}

async function memberSeesProjects(member: Page) {
  await member.goto("/dashboard");
  return member.getByRole("link", { name: "Projects", exact: true }).isVisible();
}

const transition = (from: boolean) => `${from ? "On" : "Off"} → ${from ? "Off" : "On"}`;

test.describe("Admin feature flags", () => {
  // The flip test changes a site-wide flag, so runs must not overlap,
  // including across Playwright projects.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    test.skip(
      test.info().project.name !== "chromium",
      "Changes a site-wide flag; runs in the chromium project only."
    );
  });

  test.afterEach(async () => {
    await Promise.all(contexts.splice(0).map((context) => context.close()));
  });

  test("member is redirected away from /admin/feature-flags", async ({ browser }) => {
    const member = await signedInPage(browser, "NONADMIN");

    await member.goto("/admin/feature-flags");

    await expect(member).toHaveURL(/\/dashboard/);
  });

  test("admin flip changes what a member sees, is recorded, and is restored", async ({ browser }) => {
    // Two logins plus up to two propagation waits.
    test.setTimeout(2 * PROPAGATION_TIMEOUT + 60_000);
    const admin = await signedInPage(browser, "ADMIN");
    const member = await signedInPage(browser, "NONADMIN");
    await admin.goto("/admin/feature-flags");
    const original =
      (await admin
        .getByRole("switch", { name: "Projects", exact: true })
        .getAttribute("aria-checked")) === "true";
    const timeBeforeFlip = await newestChangeTime(admin);

    try {
      await setProjectsFlag(admin, !original);

      await expect(newestChange(admin)).toContainText("Projects");
      await expect(newestChange(admin)).toContainText(transition(original));
      await expect(newestChange(admin)).not.toContainText("Outside the app");
      expect(await newestChangeTime(admin)).not.toBe(timeBeforeFlip);
      await expect
        .poll(() => memberSeesProjects(member), { timeout: PROPAGATION_TIMEOUT })
        .toBe(!original);
    } finally {
      await setProjectsFlag(admin, original);
    }

    await expect(newestChange(admin)).toContainText(transition(!original));
    await expect
      .poll(() => memberSeesProjects(member), { timeout: PROPAGATION_TIMEOUT })
      .toBe(original);
  });
});
