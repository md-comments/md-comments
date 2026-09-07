import { test, expect } from './fixtures/extensionFixture.js';
import { allure } from 'allure-playwright';
import { resetTestRepository } from '../../scripts/test-repo-cleanup.js';

test.describe('GitHub Extension: Live Repository Smoke & Regression', () => {
  const token = process.env.TEST_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const owner = process.env.TEST_REPO_OWNER || 'md-comments';
  const repo = process.env.TEST_REPO_NAME || 'md-comments-test';
  const botUser = process.env.TEST_GITHUB_USER || 'md-comments-test-bot';
  const filePath = 'README.md';
  const githubBlobUrl = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;

  test('FEAT-EXT-PLAYWRIGHT-LIVE: Full Live GitHub Verification (Panel, Auth, Comments & Persistence)', async ({
    testPage,
  }) => {
    test.setTimeout(90000);

    test.skip(!token, 'Skipping live GitHub test: TEST_GITHUB_TOKEN or GITHUB_TOKEN is missing.');

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

      await test.step('4. Verify Sidebar Panel visibility and toggle behavior', async () => {
        const fab = testPage.locator('#md-comments-fab-toggle');
        const sidebar = testPage.locator('#md-comments-sidebar');

        // Click FAB to open sidebar
        await fab.click();
        await expect(sidebar).toBeVisible({ timeout: 10000 });
        await expect
          .poll(async () => {
            return testPage.evaluate(() => {
              const el = document.getElementById('md-comments-sidebar');
              return el?.style.transform === 'translateX(0px)';
            });
          })
          .toBeTruthy();

        // Switch to Page/Document tab
        const pageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
        await expect(pageTabBtn).toBeVisible({ timeout: 5000 });
        await pageTabBtn.click();
        await expect(pageTabBtn).toHaveClass(/active/, { timeout: 5000 });

        // Switch back to Inline tab
        const inlineTabBtn = testPage.locator('.tab-btn[data-tab="inline"]');
        await expect(inlineTabBtn).toBeVisible({ timeout: 5000 });
        await inlineTabBtn.click();
        await expect(inlineTabBtn).toHaveClass(/active/, { timeout: 5000 });

        // Click close button to close drawer
        const closeBtn = testPage.locator('#md-comments-sidebar .close-btn');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        } else {
          await fab.click();
        }
        await expect
          .poll(async () => {
            return testPage.evaluate(() => {
              const el = document.getElementById('md-comments-sidebar');
              return el?.style.transform === 'translateX(100%)';
            });
          })
          .toBeTruthy();

        // Reopen drawer for subsequent comment actions
        await fab.click();
        await expect
          .poll(async () => {
            return testPage.evaluate(() => {
              const el = document.getElementById('md-comments-sidebar');
              return el?.style.transform === 'translateX(0px)';
            });
          })
          .toBeTruthy();

        // Switch to page comments tab
        await pageTabBtn.click();
        await expect(pageTabBtn).toHaveClass(/active/, { timeout: 5000 });
      });

      await test.step('5. Verify Authentication Flow and user session', async () => {
        // Unauthenticated OAuth prompt should NOT be visible
        const unauthPrompt = testPage.locator('.unauthorized-container');
        await expect(unauthPrompt).not.toBeVisible();

        // Composer textarea should be available and ready
        const textarea = testPage.locator('.page-textarea');
        await expect(textarea).toBeVisible({ timeout: 5000 });
      });

      const timestamp = new Date().toISOString();
      const pageCommentBody = `Live Playwright Smoke Run (${timestamp}): Page comment by @${botUser} mentioning @md-comments-test-mention.`;

      await test.step('6. Compose and submit live page comment', async () => {
        const textarea = testPage.locator('.page-textarea');
        await textarea.fill(pageCommentBody);

        const submitBtn = testPage.locator('.submit-page-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // Wait for composer to reset
        await expect(textarea).toHaveValue('', { timeout: 15000 });
        await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 15000 });

        // Assert comment rendered in DOM
        const card = testPage.locator('#tab-page .md-comments-card-body').filter({
          hasText: timestamp,
        });
        await expect(card).toBeVisible({ timeout: 15000 });

        const mentionLink = card
          .locator('a.md-comments-mention')
          .filter({ hasText: '@md-comments-test-mention' });
        await expect(mentionLink).toBeVisible();
      });

      let commitSha = '';
      await test.step('7. Verify comments stored remotely in refs/md-comments/data', async () => {
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
            { timeout: 20000, intervals: [1000, 2000] }
          )
          .toBeTruthy();

        // Verify native commit comment notification dispatched for mention
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
            { timeout: 20000, intervals: [1000, 2000] }
          )
          .toBeTruthy();
      });

      const inlineCommentBody = `Live Inline Smoke Comment (${timestamp}): Selected text verified by @${botUser}.`;

      await test.step('8. Select markdown text and create inline comment', async () => {
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
        await inlineTextarea.fill(inlineCommentBody);

        const submitBtn = testPage.locator('.new-inline-composer-container .fallback-submit-btn');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // Wait for async persistence to complete and composer UI to close
        await expect(inlineComposer).not.toBeVisible({ timeout: 20000 });

        const inlineCard = testPage
          .locator('#tab-inline .md-comments-card-body')
          .filter({ hasText: timestamp });
        await expect(inlineCard).toBeVisible({ timeout: 15000 });

        // Submitting progress line disappears once async commit finishes
        await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
          timeout: 20000,
        });

        // Verify that the new commit for the inline comment has been persisted to refs/md-comments/data
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
              const newSha = refData.object?.sha;
              return newSha && newSha !== commitSha ? newSha : null;
            },
            { timeout: 20000, intervals: [1000, 2000] }
          )
          .toBeTruthy();
      });

      await test.step('9. Reload page and assert comments reload from remote ref', async () => {
        await testPage.reload({ waitUntil: 'load' });
        await expect(testPage.locator('.markdown-body')).toBeVisible({ timeout: 15000 });

        const sidebar = testPage.locator('#md-comments-sidebar');
        await expect(sidebar).toBeVisible({ timeout: 20000 });

        // Ensure sidebar is open (either auto-opened or click FAB)
        const isOpen = await testPage.evaluate(() => {
          const el = document.getElementById('md-comments-sidebar');
          return el?.style.transform === 'translateX(0px)';
        });
        if (!isOpen) {
          const fab = testPage.locator('#md-comments-fab-toggle');
          if (await fab.isVisible()) {
            await fab.click();
          }
        }

        await expect
          .poll(async () => {
            return testPage.evaluate(() => {
              const el = document.getElementById('md-comments-sidebar');
              return el?.style.transform === 'translateX(0px)';
            });
          })
          .toBeTruthy();

        // Verify page comment reloaded
        const pageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
        await expect(pageTabBtn).toBeVisible({ timeout: 5000 });
        await pageTabBtn.click();

        const reloadedPageCard = testPage
          .locator('#tab-page .md-comments-card-body')
          .filter({ hasText: timestamp });
        await expect(reloadedPageCard).toBeVisible({ timeout: 15000 });

        // Verify inline comment reloaded
        const inlineTabBtn = testPage.locator('.tab-btn[data-tab="inline"]');
        await inlineTabBtn.click();

        const reloadedInlineCard = testPage
          .locator('#tab-inline .md-comments-card-body')
          .filter({ hasText: timestamp });
        await expect(reloadedInlineCard).toBeVisible({ timeout: 15000 });
      });
    } finally {
      await test.step('10. Post-test cleanup on test repository', async () => {
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
