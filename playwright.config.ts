import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker to ensure isolated extension Chrome instances
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
      },
    ],
  ],
  use: {
    trace: 'on',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-headless',
      testIgnore: [/.*safari-extension\.spec\.ts/, /.*vscode-.*\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
    {
      name: 'webkit',
      testMatch: /.*safari-extension\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'vscode-electron',
      testMatch: /.*vscode-.*\.spec\.ts/,
      timeout: 60000,
    },
  ],
});
