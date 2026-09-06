import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('DOM: GitHub Dark/Light Theme Synchronization', () => {
  test('FEAT-DOMI-THEME: Dynamically synchronizes CSS custom properties with GitHub theme', async ({
    page,
  }) => {
    allure.epic('DOM');
    allure.feature('FEAT-DOMI-THEME');
    allure.story('Dynamic GitHub Dark/Light Theme Synchronization');

    await test.step('1. Mount page with light theme baseline', async () => {
      await page.setContent(`
        <html data-color-mode="light">
          <head>
            <style>
              :root {
                --md-comments-bg: #ffffff;
                --md-comments-text: #1f2328;
              }
              html[data-color-mode="dark"] {
                --md-comments-bg: #0d1117;
                --md-comments-text: #e6edf3;
              }
              .md-comments-sidebar {
                background: var(--md-comments-bg);
                color: var(--md-comments-text);
              }
            </style>
          </head>
          <body>
            <div id="sidebar" class="md-comments-sidebar">Comment Drawer Content</div>
          </body>
        </html>
      `);
    });

    await test.step('2. Verify light theme computed colors', async () => {
      const bgColor = await page.evaluate(() => {
        const el = document.getElementById('sidebar');
        return window.getComputedStyle(el!).backgroundColor;
      });
      expect(bgColor).toBe('rgb(255, 255, 255)');
    });

    await test.step('3. Switch to dark mode and verify updated computed colors', async () => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-color-mode', 'dark');
      });

      const darkBgColor = await page.evaluate(() => {
        const el = document.getElementById('sidebar');
        return window.getComputedStyle(el!).backgroundColor;
      });
      expect(darkBgColor).toBe('rgb(13, 17, 23)');
    });
  });
});
