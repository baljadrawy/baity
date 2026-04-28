/**
 * Playwright Config — اختبارات E2E
 *
 * التشغيل المحلي: npm run test:e2e
 * يفترض أن خادم التطوير يعمل على PLAYWRIGHT_BASE_URL (افتراضياً http://127.0.0.1:3001)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
