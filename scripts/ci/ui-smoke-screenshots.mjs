#!/usr/bin/env node
//
// ui-smoke-screenshots.mjs — capture rendered evidence for a UI-surface
// dependency bump so a reviewer can judge visual regression without checking
// the branch out locally.
//
// Only unauthenticated pages are in scope: the caller supplies placeholder
// Supabase env (never a real secret), so anything behind auth renders a
// redirect or error state that would be misleading to screenshot. Those
// surfaces stay a manual check — docs/runbooks/validating-dependency-updates.md.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = process.env.UI_SMOKE_OUT_DIR ?? "ui-smoke-output";
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 375, height: 812 },
];
const PAGES = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const consoleLog = [];
let hadFailure = false;

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({ viewport });
  for (const page of PAGES) {
    const tab = await context.newPage();
    tab.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) {
        consoleLog.push(`[${page.name}/${viewport.name}] ${msg.type()}: ${msg.text()}`);
      }
    });
    tab.on("pageerror", (err) => {
      consoleLog.push(`[${page.name}/${viewport.name}] pageerror: ${err.message}`);
    });

    const response = await tab.goto(`${BASE_URL}${page.path}`, { waitUntil: "networkidle" });
    if (!response || !response.ok()) {
      consoleLog.push(`[${page.name}/${viewport.name}] navigation failed: ${response?.status()}`);
      hadFailure = true;
    }

    await tab.screenshot({ path: `${OUT_DIR}/${page.name}-${viewport.name}.png`, fullPage: true });
    await tab.close();
  }
  await context.close();
}

await browser.close();

writeFileSync(
  `${OUT_DIR}/console-output.txt`,
  consoleLog.length ? consoleLog.join("\n") : "No console errors or warnings observed.\n"
);

console.log(`Captured ${VIEWPORTS.length * PAGES.length} screenshots to ${OUT_DIR}/`);

if (hadFailure) {
  console.error("One or more pages failed to load — see console-output.txt");
  process.exit(1);
}
