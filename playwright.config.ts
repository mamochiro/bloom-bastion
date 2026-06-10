import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config — the real-browser runtime proof jsdom can't give
 * (closes the last M0 item). Mobile-first per SPEC: one chromium project on a
 * portrait Pixel 5 viewport (393×851). The dev server is started/reused on 5173.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
