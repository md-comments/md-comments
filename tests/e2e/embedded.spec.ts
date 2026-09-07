import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import path from 'path';
import { startStaticServer, type StaticServer } from './fixtures/staticServer.js';

const WEBSITE_DIR = path.resolve(process.cwd(), 'website');

test.describe('Embedded Runtime (embed-js): Standalone Script, Drawer, Mock Mode & Security', () => {
  let server: StaticServer;

  test.beforeAll(async () => {
    server = await startStaticServer(WEBSITE_DIR);
  });

  test.afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  test('FEAT-EMBED-RUNTIME: Initializes embed script, renders FAB, toggles drawer & tabs', async ({
    page,
  }) => {
    allure.epic('Embedded Runtime');
    allure.feature('FEAT-EMBED-RUNTIME');
    allure.story('Drop-in Script Initialization & Drawer Lifecycle');

    await test.step('1. Navigate to HTML demo with embedded runtime script', async () => {
      await page.goto(`${server.url}/demo-mock/index.html`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('2. Verify Floating Action Button (FAB) rendered in DOM', async () => {
      const fab = page.locator('.md-comments-fab-toggle');
      await expect(fab).toBeAttached({ timeout: 5000 });
      const badge = fab.locator('.badge-count');
      await expect(badge).toBeAttached();
    });

    await test.step('3. Open and close the collapsible comments drawer via close button', async () => {
      const drawer = page.locator('.md-comments-drawer');
      await expect(drawer).toBeAttached();

      const fab = page.locator('.md-comments-fab-toggle');
      await expect(fab).toBeVisible({ timeout: 5000 });
      await fab.click();
      await expect(drawer).toHaveClass(/md-comments-drawer-open/);

      const closeBtn = page.locator('.md-comments-drawer-close');
      await closeBtn.click();
      await expect(drawer).not.toHaveClass(/md-comments-drawer-open/);

      // Re-open for subsequent tab tests
      await fab.click();
      await expect(drawer).toHaveClass(/md-comments-drawer-open/);
    });

    await test.step('4. Switch between Inline and Page comment tabs', async () => {
      const pageTabBtn = page.locator('.md-comments-tab-btn[data-tab="page"]');
      await pageTabBtn.click();
      await expect(pageTabBtn).toHaveClass(/active/);

      const pagePanel = page.locator('#panel-page');
      await expect(pagePanel).toHaveClass(/active/);

      const inlineTabBtn = page.locator('.md-comments-tab-btn[data-tab="inline"]');
      await inlineTabBtn.click();
      await expect(inlineTabBtn).toHaveClass(/active/);
    });

    await test.step('5. Toggle drawer via keyboard shortcut Ctrl+Shift+C', async () => {
      const drawer = page.locator('.md-comments-drawer');
      await page.keyboard.press('Control+Shift+C');
      await expect(drawer).not.toHaveClass(/md-comments-drawer-open/);

      await page.keyboard.press('Control+Shift+C');
      await expect(drawer).toHaveClass(/md-comments-drawer-open/);
    });
  });

  test('FEAT-EMBED-MOCK: Executes full offline CRUD comment lifecycle in zero-auth mock mode', async ({
    page,
  }) => {
    allure.epic('Embedded Runtime');
    allure.feature('FEAT-EMBED-MOCK');
    allure.story('Zero-Auth Local Mock Mode CRUD Lifecycle');

    await test.step('1. Navigate to demo mock page and open drawer', async () => {
      await page.goto(`${server.url}/demo-mock/index.html`);
      await page.waitForLoadState('domcontentloaded');

      const drawer = page.locator('.md-comments-drawer');
      await expect(drawer).toBeAttached();
      const isDrawerOpen = await drawer
        .evaluate((el) => el.classList.contains('md-comments-drawer-open'))
        .catch(() => false);
      if (!isDrawerOpen) {
        const fab = page.locator('.md-comments-fab-toggle');
        await expect(fab).toBeVisible({ timeout: 5000 });
        await fab.click();
      }
      await expect(drawer).toHaveClass(/md-comments-drawer-open/);
    });

    await test.step('2. Submit a new whole-document page comment', async () => {
      const pageTabBtn = page.locator('.md-comments-tab-btn[data-tab="page"]');
      await pageTabBtn.click();

      const textarea = page.locator('#panel-page .page-textarea');
      await textarea.fill('Testing automated mock comment via Playwright.');

      const submitBtn = page.locator('#panel-page .submit-page-btn');
      await submitBtn.click();

      // Verify comment card appears in the page threads list
      const commentCard = page.locator('#page-threads-list .md-comments-card').first();
      await expect(commentCard).toBeVisible({ timeout: 5000 });
      await expect(commentCard).toContainText('Testing automated mock comment via Playwright.');
    });

    await test.step('3. Add a threaded reply to the comment', async () => {
      const replyInput = page.locator('#page-threads-list .reply-input').first();
      await expect(replyInput).toBeVisible({ timeout: 5000 });
      await replyInput.focus();

      const replyTextarea = page.locator('#page-threads-list .reply-expanded textarea').first();
      await expect(replyTextarea).toBeVisible();
      await replyTextarea.fill('Automated threaded reply test.');

      const sendBtn = page.locator('#page-threads-list .send-reply-btn').first();
      await sendBtn.click({ force: true });

      // Assert reply content is now visible
      await expect(
        page.locator('#page-threads-list .reply-item, #page-threads-list .reply-body').first()
      ).toBeVisible();
      await expect(page.locator('#page-threads-list')).toContainText(
        'Automated threaded reply test.'
      );
    });

    await test.step('4. Toggle emoji reaction with optimistic UI count', async () => {
      const reactionChip = page.locator('#page-threads-list .reaction-chip').first();
      if (await reactionChip.isVisible()) {
        const initialCount = await reactionChip.locator('span').innerText();
        await reactionChip.click();
        const updatedCount = await reactionChip.locator('span').innerText();
        expect(updatedCount).not.toEqual(initialCount);
      }
    });
  });

  test('FEAT-SECU-XSS: Sanitizes malicious scripts and dangerous attributes in embedded comments', async ({
    page,
  }) => {
    allure.epic('Security');
    allure.feature('FEAT-SECU-XSS');
    allure.story('DOMPurify Markdown Content Sanitization in Embedded HTML');

    await test.step('1. Load demo page and open composer', async () => {
      await page.goto(`${server.url}/demo-mock/index.html`);
      await page.waitForLoadState('domcontentloaded');

      const drawer = page.locator('.md-comments-drawer');
      await expect(drawer).toBeAttached();
      const isDrawerOpen = await drawer
        .evaluate((el) => el.classList.contains('md-comments-drawer-open'))
        .catch(() => false);
      if (!isDrawerOpen) {
        const fab = page.locator('.md-comments-fab-toggle');
        await expect(fab).toBeVisible({ timeout: 5000 });
        await fab.click();
      }
      await expect(drawer).toHaveClass(/md-comments-drawer-open/);

      const pageTabBtn = page.locator('.md-comments-tab-btn[data-tab="page"]');
      await pageTabBtn.click();
    });

    await test.step('2. Post malicious XSS payload', async () => {
      const xssPayload =
        '<script>window.__XSS_TRIGGERED__ = true;</script><img src="x" onerror="window.__XSS_IMG__ = true" />Safe content.';
      const textarea = page.locator('#panel-page .page-textarea');
      await textarea.fill(xssPayload);

      const submitBtn = page.locator('#panel-page .submit-page-btn');
      await submitBtn.click();
    });

    await test.step('3. Verify script execution was prevented and scripts stripped', async () => {
      const isXssTriggered = await page.evaluate(() => (window as any).__XSS_TRIGGERED__);
      const isImgXssTriggered = await page.evaluate(() => (window as any).__XSS_IMG__);
      expect(isXssTriggered).toBeFalsy();
      expect(isImgXssTriggered).toBeFalsy();

      const scriptTags = await page.locator('#page-threads-list script').count();
      expect(scriptTags).toBe(0);
    });
  });
});
