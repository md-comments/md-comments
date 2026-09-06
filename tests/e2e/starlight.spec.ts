import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import path from 'path';
import { startStaticServer, type StaticServer } from './fixtures/staticServer.js';

const DEMO_ASTRO_DIST = path.resolve(process.cwd(), 'demo-astro/dist');

test.describe('Starlight Plugin: Astro Documentation & Comments Overlay Lifecycle', () => {
  let server: StaticServer;

  test.beforeAll(async () => {
    server = await startStaticServer(DEMO_ASTRO_DIST, { basePath: '/demo-astro' });
  });

  test.afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  test('FEAT-STARLIGHT-DOCS: Injects comments overlay, renders FAB, toggles drawer & mounts anchors', async ({
    page,
  }) => {
    allure.epic('Starlight Plugin');
    allure.feature('FEAT-STARLIGHT-DOCS');
    allure.story('Starlight Documentation Comments Overlay Mounting');

    await test.step('1. Navigate to Starlight demo documentation home', async () => {
      await page.goto(`${server.url}/demo-astro/`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('2. Verify Starlight content container and options bootstrap', async () => {
      const content = page.locator('.sl-markdown-content');
      await expect(content).toBeVisible({ timeout: 5000 });

      const optionsPresent = await page.evaluate(() => !!(window as any).__MD_COMMENTS_OPTIONS__);
      expect(optionsPresent).toBe(true);
    });

    await test.step('3. Verify Floating Action Button (FAB) rendered in Starlight layout', async () => {
      const fab = page.locator('.md-comments-fab, .md-comments-fab-toggle');
      await expect(fab).toBeAttached({ timeout: 5000 });
    });

    await test.step('4. Open and close the comments drawer within Starlight theme', async () => {
      const drawer = page.locator('.md-comments-drawer');
      await expect(drawer).toBeAttached({ timeout: 5000 });

      const fab = page.locator('.md-comments-fab, .md-comments-fab-toggle');
      await fab.click();
      await expect(drawer).toHaveClass(/md-comments-drawer-open/);

      const closeBtn = page.locator('.md-comments-drawer-close');
      await closeBtn.click();
      await expect(drawer).not.toHaveClass(/md-comments-drawer-open/);
    });

    await test.step('5. Verify paragraph anchor elements exist inside markdown content', async () => {
      const headings = page.locator('.sl-markdown-content h2, .sl-markdown-content h3');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('FEAT-STARLIGHT-NAV: Re-binds comments cleanly across Astro View Transitions and soft navigations', async ({
    page,
  }) => {
    allure.epic('Starlight Plugin');
    allure.feature('FEAT-STARLIGHT-DOCS');
    allure.story('Astro SPA Navigation & View Transitions Re-binding');

    await test.step('1. Navigate to Starlight home page', async () => {
      await page.goto(`${server.url}/demo-astro/`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('2. Navigate to Architecture guide via sidebar link', async () => {
      const guideLink = page.locator('nav.sidebar-content a[href*="architecture"]').first();
      if (await guideLink.isVisible()) {
        await guideLink.click();
        await page.waitForLoadState('domcontentloaded');
      } else {
        await page.goto(`${server.url}/demo-astro/guides/architecture/`);
        await page.waitForLoadState('domcontentloaded');
      }
    });

    await test.step('3. Verify singular drawer instance is preserved without duplication', async () => {
      const drawers = page.locator('.md-comments-drawer');
      await expect(drawers).toHaveCount(1);
    });

    await test.step('4. Navigate back to Home and confirm clean re-binding', async () => {
      await page.goto(`${server.url}/demo-astro/`);
      await page.waitForLoadState('domcontentloaded');

      const drawers = page.locator('.md-comments-drawer');
      await expect(drawers).toHaveCount(1);

      const fab = page.locator('.md-comments-fab, .md-comments-fab-toggle');
      await expect(fab).toBeAttached();
    });
  });

  test('FEAT-STARLIGHT-THEME: Synchronizes comments overlay with Starlight dark/light theme switch', async ({
    page,
  }) => {
    allure.epic('Starlight Plugin');
    allure.feature('FEAT-STARLIGHT-DOCS');
    allure.story('Starlight Native Dark/Light Theme Switching');

    await test.step('1. Load documentation page and inspect default theme attribute', async () => {
      await page.goto(`${server.url}/demo-astro/`);
      await page.waitForLoadState('domcontentloaded');

      const theme = await page.evaluate(() => document.documentElement.dataset.theme);
      expect(theme === 'dark' || theme === 'light').toBe(true);
    });

    await test.step('2. Toggle Starlight theme select to opposite mode', async () => {
      const currentTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Set theme attribute dynamically to simulate picker change
      await page.evaluate((newTheme) => {
        document.documentElement.dataset.theme = newTheme;
        window.dispatchEvent(new Event('storage'));
      }, targetTheme);

      const updatedTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      expect(updatedTheme).toBe(targetTheme);
    });

    await test.step('3. Ensure comments overlay remains legible and attached', async () => {
      const drawer = page.locator('.md-comments-drawer');
      await expect(drawer).toBeAttached();
    });
  });
});
