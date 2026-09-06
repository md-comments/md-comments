import { test, expect } from './fixtures/extensionFixture.js';
import { allure } from 'allure-playwright';
import { createLocalMockServer, LocalMockServer } from '../mocks/localMockServer.js';
import fs from 'fs';
import path from 'path';
const FIXTURE_HTML_PATH = path.resolve(process.cwd(), 'tests/fixtures/github-markdown-page.html');

test.describe('GitHub Extension: Hermetic Playwright E2E Lifecycle', () => {
  let mockServer: LocalMockServer;
  let mockUrl: string;

  test.beforeAll(async () => {
    mockServer = createLocalMockServer();
    mockUrl = await mockServer.start();
  });

  test.afterAll(async () => {
    await mockServer.stop();
  });

  test('FEAT-EXT-PLAYWRIGHT-MOCK: Loads unpacked extension in Chromium, opens sidebar, and creates comment on GitHub DOM', async ({
    context,
    testPage,
  }) => {
    allure.epic('Browser Extension');
    allure.feature('FEAT-EXT-PLAYWRIGHT-MOCK');
    allure.story('Hermetic Extension Load & Comment Submission');

    const owner = 'md-comments';
    const repo = 'md-comments-test';
    const filePath = 'README.md';
    const githubBlobUrl = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;

    await test.step('1. Setup hermetic routing for GitHub DOM and API', async () => {
      // Intercept github.com requests to serve fixture HTML and raw markdown
      await context.route('https://github.com/**', async (route) => {
        const reqUrl = new URL(route.request().url());

        if (reqUrl.searchParams.get('raw') === 'true') {
          await route.fulfill({
            status: 200,
            contentType: 'text/plain; charset=utf-8',
            body: '# Test Fixture Document\n\nThis is the first paragraph of documentation to be commented on.\n\nSecond paragraph providing further details on testing features and flow.\n',
          });
          return;
        }

        if (reqUrl.pathname.includes('/blob/')) {
          const html = fs.readFileSync(FIXTURE_HTML_PATH, 'utf8');
          await route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: html,
          });
          return;
        }

        await route.continue();
      });

      // Intercept api.github.com requests and proxy directly to LocalMockServer
      await context.route('https://api.github.com/**', async (route) => {
        const reqUrl = new URL(route.request().url());
        const targetUrl = `${mockUrl}${reqUrl.pathname}${reqUrl.search}`;
        const headers = route.request().headers();
        const method = route.request().method();
        const postData = route.request().postData();

        try {
          const res = await fetch(targetUrl, {
            method,
            headers,
            body: postData || undefined,
          });
          const body = await res.text();
          await route.fulfill({
            status: res.status,
            headers: Object.fromEntries(res.headers.entries()),
            body,
          });
        } catch (err: any) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: err.message }),
          });
        }
      });
    });

    await test.step('2. Navigate to GitHub markdown document', async () => {
      testPage.on('console', (msg) => console.log('[BROWSER LOG]', msg.text()));
      testPage.on('pageerror', (err) => console.error('[BROWSER ERROR]', err));
      await testPage.goto(githubBlobUrl, { waitUntil: 'load' });
      await expect(testPage.locator('.markdown-body')).toBeVisible();
    });

    await test.step('3. Wait for Chrome extension to inject FAB button', async () => {
      const fab = testPage.locator('#md-comments-fab-toggle');
      await expect(fab).toBeVisible({ timeout: 15000 });
    });

    await test.step('4. Open comments sidebar drawer', async () => {
      const fab = testPage.locator('#md-comments-fab-toggle');
      await fab.click();

      const drawer = testPage.locator('.md-comments-drawer, #md-comments-sidebar');
      await expect(drawer).toBeVisible({ timeout: 5000 });
    });

    await test.step('5. Switch to Page Comments tab and compose comment', async () => {
      const pageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
      await expect(pageTabBtn).toBeVisible();
      await pageTabBtn.click();

      const textarea = testPage.locator('.page-textarea');
      await expect(textarea).toBeVisible({ timeout: 5000 });

      const commentText = 'Hermetic Playwright E2E Comment: Automated verification on GitHub DOM.';
      await textarea.fill(commentText);
      await expect(textarea).toHaveValue(commentText);

      const submitBtn = testPage.locator('.submit-page-btn');
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();

      // Wait for async persistence to complete (textarea is cleared upon successful write)
      await expect(textarea).toHaveValue('', { timeout: 10000 });
      await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 10000 });
    });

    await test.step('6. Assert comment card renders in drawer and ref updates on mock API', async () => {
      const commentCard = testPage
        .locator('#tab-page .md-comments-card-body')
        .filter({ hasText: 'Hermetic Playwright E2E Comment' });
      await expect(commentCard).toBeVisible({ timeout: 10000 });

      // Verify that the mock GitHub server has the updated comment ref
      await expect
        .poll(
          async () => {
            const refRes = await fetch(
              `${mockUrl}/repos/${owner}/${repo}/git/refs/md-comments/data`
            );
            if (!refRes.ok) return null;
            const refData: any = await refRes.json();
            return refData.object?.sha;
          },
          {
            timeout: 10000,
            intervals: [500, 1000],
          }
        )
        .toBeTruthy();
    });
  });
});
