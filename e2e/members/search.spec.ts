import { test, expect, type Page } from "@playwright/test";

import { loginWithPassword, requireE2ECredentials } from "../fixtures/auth";

const SEARCH_DEBOUNCE_MS = 300;
const DEBOUNCE_SETTLE_MS = SEARCH_DEBOUNCE_MS + 100;

async function gotoMembers(page: Page) {
  const creds = requireE2ECredentials("APPROVED_ONBOARDED");
  await loginWithPassword(page, creds);
  await page.goto("/members");
  await expect(page.getByLabel(/search/i)).toBeVisible();
}

// Parked: URL-based assertions fail under Playwright because App Router's
// pushState is silently skipped (vercel/next.js#83386, fixed upstream by
// facebook/react#35839). The fix ships in Next.js 16.2.0+ via its bundled
// React canary. This project is on Next 16.1.6 — unskip after the Next bump.
test.describe.skip("Members search: debounce, history, and scroll behavior", () => {
  test("debounced typing updates URL via replace (no new history entry)", async ({
    page,
  }) => {
    await gotoMembers(page);
    const search = page.getByLabel(/search/i);

    await search.fill("alice");
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);

    // /members was replaced (not pushed) with /members?q=alice, so Back
    // skips past it entirely to the prior page (dashboard).
    await page.goBack();
    await expect(page).not.toHaveURL(/\/members(?:\?|$)/);
  });

  test("Enter commits search via push (new history entry)", async ({ page }) => {
    await gotoMembers(page);
    const search = page.getByLabel(/search/i);

    await search.fill("ali");
    await expect(page).toHaveURL(/[?&]q=ali(?:&|$)/);

    await search.fill("alice");
    await search.press("Enter");
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);

    // Enter pushed a new entry, so Back returns to the prior (replaced)
    // ?q=ali state — not all the way out of /members.
    await page.goBack();
    await expect(page).toHaveURL(/[?&]q=ali(?:&|$)/);
  });

  test("blur with a new value commits via push", async ({ page }) => {
    await gotoMembers(page);
    const search = page.getByLabel(/search/i);

    await search.fill("alice");
    // Tab out BEFORE debounce fires — commit handler must cancel the
    // pending replace and push instead.
    await search.press("Tab");
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);

    await page.goBack();
    await expect(page).toHaveURL(/\/members(?!\?q)/);
  });

  test("blur with no change is a no-op (no duplicate history entry)", async ({
    page,
  }) => {
    await gotoMembers(page);
    const search = page.getByLabel(/search/i);

    await search.fill("alice");
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);

    // Re-focus and blur without typing — commitSearch should short-circuit
    // because value === lastPushedQ.
    await search.click();
    await search.press("Tab");
    await page.waitForTimeout(DEBOUNCE_SETTLE_MS);

    // If a duplicate push had occurred, Back would land on the prior
    // /members?q=alice (replaced) entry — still on /members. With the
    // no-op short-circuit, Back exits /members entirely.
    await page.goBack();
    await expect(page).not.toHaveURL(/\/members(?:\?|$)/);
  });

  test("input value does not cycle while typing (original bug)", async ({
    page,
  }) => {
    await gotoMembers(page);
    const search = page.getByLabel(/search/i);

    await search.pressSequentially("alice", { delay: 50 });

    // The input must show what was typed without being clobbered by any
    // URL→state sync effect (the original feedback loop).
    await expect(search).toHaveValue("alice");
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);

    // Stability check: value stays put after URL settles.
    await page.waitForTimeout(DEBOUNCE_SETTLE_MS);
    await expect(search).toHaveValue("alice");
  });

  test("filter toggle preserves scroll position", async ({ page }) => {
    await gotoMembers(page);

    const scrollableHeight = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    test.skip(
      scrollableHeight <= 0,
      "Members list is not tall enough to scroll in this environment"
    );

    await page.evaluate(() => window.scrollTo(0, 200));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    const checkbox = page.getByLabel(/open to mock interviews/i);
    await checkbox.click();
    await expect(page).toHaveURL(/[?&]referrals=true(?:&|$)/);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBe(scrollBefore);
  });

  test("browser back/forward syncs input value to URL", async ({ page }) => {
    await gotoMembers(page);
    const search = page.getByLabel(/search/i);

    await search.fill("alice");
    await search.press("Enter");
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);

    await search.fill("bob");
    await search.press("Enter");
    await expect(page).toHaveURL(/[?&]q=bob(?:&|$)/);
    await expect(search).toHaveValue("bob");

    await page.goBack();
    await expect(page).toHaveURL(/[?&]q=alice(?:&|$)/);
    await expect(search).toHaveValue("alice");

    await page.goForward();
    await expect(page).toHaveURL(/[?&]q=bob(?:&|$)/);
    await expect(search).toHaveValue("bob");
  });
});
