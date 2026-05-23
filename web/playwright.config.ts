import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 설정.
 * 정적 export 산출물(`out/`) 을 `npx serve out` 으로 서빙해 테스트.
 * 또는 dev server (`npm run dev`) 도 사용 가능 — 기본은 next start 호환을 위해 serve 사용.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000/tools',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
