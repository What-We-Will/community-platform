import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// Load E2E test credentials from .env.e2e (never committed).
// Uses Node 20.12+ built-in — no dotenv dependency needed.
if (existsSync(".env.e2e")) {
  process.loadEnvFile(".env.e2e");
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "chromium-headed",
      use: {
        browserName: "chromium",
        headless: false,
        video: "on",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
