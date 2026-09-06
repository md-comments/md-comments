import { test, expect } from './fixtures/extensionFixture.js';
import { allure } from 'allure-playwright';
import { resetTestRepository } from '../../scripts/test-repo-cleanup.js';

test.describe('GitHub Extension: Live Repository Smoke & Regression', () => {
  const token = process.env.TEST_GITHUB_TOKEN;
  const runLive = process.env.RUN_LIVE_GITHUB_E2E === 'true';
  const owner = process.env.TEST_REPO_OWNER || 'md-comments';
  const repo = process.env.TEST_REPO_NAME || 'md-comments-test';
  const filePath = 'README.md';
  const githubBlobUrl = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;

  test('FEAT-EXT-PLAYWRIGHT-LIVE: Automates extension comment creation directly on https://github.com/md-comments/md-comments-test', async ({
    testPage,
  }) => {
    test.skip(
      !token || !runLive,
      'Skipping live GitHub test: TEST_GITHUB_TOKEN is missing or RUN_LIVE_GITHUB_E2E is not set to "true".'
    );

    allure.epic('Browser Extension');
    allure.feature('FEAT-EXT-PLAYWRIGHT-LIVE');
    allure.story('Live GitHub Repository Comment Creation & Persistence');

    await test.step('1. Pre-test cleanup on test repository', async () => {
      await resetTestRepository({ token, owner, repo });
    });

    try {
      await test.step('2. Navigate to live GitHub markdown file', async () => {
        await testPage.goto(githubBlobUrl, { waitUntil: 'load', timeout: 30000 });
        await expect(testPage.locator('.markdown-body')).toBeVisible({ timeout: 15000 });
      });

      await test.step('3. Wait for Chrome extension to inject FAB button', async () => {
        const fab = testPage.locator('#md-comments-fab-toggle');
        await expect(fab).toBeVisible({ timeout: 20000 });
      });

      await test.step('4. Open sidebar drawer and switch to Page Comments tab', async () => {
        const fab = testPage.locator('#md-comments-fab-toggle');
        await fab.click();

        const drawer = testPage.locator('.md-comments-drawer, #md-comments-sidebar');
        await expect(drawer).toBeVisible({ timeout: 5000 });

        const pageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
        await expect(pageTabBtn).toBeVisible();
        await pageTabBtn.click();
      });

      const commentBody = `Live Playwright Smoke Run (${new Date().toISOString()}): Verification comment.`;

      await test.step('5. Compose and submit live comment', async () => {
        const textarea = testPage.locator('.page-textarea');
        await expect(textarea).toBeVisible({ timeout: 5000 });
        await textarea.fill(commentBody);

        const submitBtn = testPage.locator('.submit-page-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();
      });

      await test.step('6. Assert comment rendered in DOM and verified on remote GitHub API', async () => {
        const card = testPage.locator('#tab-page .md-comments-card-body').filter({
          hasText: 'Live Playwright Smoke Run',
        });
        await expect(card).toBeVisible({ timeout: 15000 });

        // Query GitHub REST API directly to verify ref creation
        const refRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/md-comments/data`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `token ${token}`,
              'User-Agent': 'md-comments-test-verification',
            },
          }
        );
        expect(refRes.status).toBe(200);
        const refData: any = await refRes.json();
        expect(refData.object?.sha).toBeDefined();
      });
    } finally {
      await test.step('7. Post-test cleanup on test repository', async () => {
        await resetTestRepository({ token, owner, repo });
      });
    }
  });
});
