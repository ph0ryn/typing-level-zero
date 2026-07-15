import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env["CI"]);

export default defineConfig({
  forbidOnly: isCi,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: Number(isCi) * 2,
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:4173/typing-level-zero/",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm run build && pnpm exec vite preview --host 127.0.0.1",
    reuseExistingServer: !isCi,
    timeout: 120_000,
    url: "http://127.0.0.1:4173/typing-level-zero/",
  },
});
