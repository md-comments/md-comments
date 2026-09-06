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

      const commentBody = `Live Playwright Smoke Run (${new Date().toISOString()}): Verification comment mentioning @md-comments-test-mention.`;

      await test.step('5. Compose and submit live comment', async () => {
        const textarea = testPage.locator('.page-textarea');
        await expect(textarea).toBeVisible({ timeout: 5000 });
        await textarea.fill(commentBody);

        const submitBtn = testPage.locator('.submit-page-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // Wait for async persistence to complete
        await expect(textarea).toHaveValue('', { timeout: 10000 });
        await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 10000 });
      });

      await test.step('6. Assert comment rendered in DOM and verified on remote GitHub API', async () => {
        const card = testPage.locator('#tab-page .md-comments-card-body').filter({
          hasText: 'Live Playwright Smoke Run',
        });
        await expect(card).toBeVisible({ timeout: 15000 });

        const mentionLink = card
          .locator('a.md-comments-mention')
          .filter({ hasText: '@md-comments-test-mention' });
        await expect(mentionLink).toBeVisible();

        // Query GitHub REST API directly to verify ref creation with polling
        let commitSha = '';
        await expect
          .poll(
            async () => {
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
              if (!refRes.ok) return null;
              const refData: any = await refRes.json();
              commitSha = refData.object?.sha;
              return commitSha;
            },
            { timeout: 15000, intervals: [1000, 2000] }
          )
          .toBeTruthy();

        // Verify that GitHub native commit comment notification was posted for @md-comments-test-mention
        await expect
          .poll(
            async () => {
              const commentsRes = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}/comments`,
                {
                  headers: {
                    Accept: 'application/vnd.github.v3+json',
                    Authorization: `token ${token}`,
                    'User-Agent': 'md-comments-test-verification',
                  },
                }
              );
              if (!commentsRes.ok) return false;
              const commentsList: any = await commentsRes.json();
              return commentsList.some((c: any) => c.body?.includes('@md-comments-test-mention'));
            },
            { timeout: 15000, intervals: [1000, 2000] }
          )
          .toBeTruthy();
      });

      await test.step('7. Select markdown text and create inline comment with mention', async () => {
        await testPage.evaluate(() => {
          const p = document.querySelector('.markdown-body p');
          if (!p) throw new Error('Markdown paragraph not found');
          const range = document.createRange();
          range.selectNodeContents(p);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });

        const selBtn = testPage.locator('#md-comments-selection-button');
        await expect(selBtn).toBeVisible({ timeout: 5000 });
        await selBtn.click();

        const inlineComposer = testPage.locator('.new-inline-composer-wrapper');
        await expect(inlineComposer).toBeVisible({ timeout: 5000 });

        const inlineTextarea = testPage.locator(
          '.new-inline-composer-container .fallback-reply-textarea'
        );
        await expect(inlineTextarea).toBeVisible({ timeout: 5000 });

        const inlineCommentBody = `Live Inline Smoke Comment (${new Date().toISOString()}): Target text verified mentioning @md-comments-test-mention.`;
        await inlineTextarea.fill(inlineCommentBody);

        const submitBtn = testPage.locator('.new-inline-composer-container .fallback-submit-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        const inlineCard = testPage
          .locator('#tab-inline .md-comments-card-body')
          .filter({ hasText: 'Live Inline Smoke Comment' });
        await expect(inlineCard).toBeVisible({ timeout: 15000 });

        const mentionLink = inlineCard
          .locator('a.md-comments-mention')
          .filter({ hasText: '@md-comments-test-mention' });
        await expect(mentionLink).toBeVisible();
      });
    } finally {
      await test.step('8. Post-test cleanup on test repository', async () => {
        if (process.env.KEEP_TEST_COMMENTS === 'true') {
          console.log(
            '[Test Repo] KEEP_TEST_COMMENTS=true: Preserving created comments on remote repository.'
          );
          return;
        }
        await resetTestRepository({ token, owner, repo });
      });
    }
  });
});
