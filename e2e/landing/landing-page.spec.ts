import { test, expect, Page } from "@playwright/test";

test.describe("Landing page (anonymous)", () => {
  test.describe("Static header elements", () => {
    let sharedPage: Page;
    test.beforeAll(async ({ browser }) => {
      sharedPage = await browser.newPage();
      await sharedPage.goto("/");
    });

    test.afterAll(async () => { await sharedPage.close(); });

    test("Logo", async () => {
      await expect(sharedPage.getByAltText("What We Will logo")).toBeVisible();
    });

    test("About Us link", async () => {
      await expect(sharedPage.getByRole("link", { name: "About Us" })).toBeVisible();
    });

    test("Our Programs link", async () => {
      await expect(sharedPage.getByRole("link", { name: "Our Programs" })).toBeVisible();
    });

    test("News link", async () => {
      await expect(sharedPage.getByRole("link", { name: "News" })).toBeVisible();
    });

    test("Donate link", async () => {
      await expect(
        sharedPage.getByRole("link", { name: "Donate", exact: true })
      ).toBeVisible();
    });
  });

  test.describe("Auth-conditional header", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });
    test("shows Login and hides Dashboard", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    });
  });
});