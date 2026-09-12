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

    const interceptedApiUrls: string[] = [];
    const interceptedPostBodies: string[] = [];

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

        interceptedApiUrls.push(reqUrl.pathname + reqUrl.search);
        if (postData) {
          interceptedPostBodies.push(postData);
        }

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

      const commentText =
        'Hermetic Playwright E2E Comment: Automated verification on GitHub DOM mentioning @md-comments-test-mention.';
      await textarea.fill(commentText);
      await expect(textarea).toHaveValue(commentText);

      const submitBtn = testPage.locator('.submit-page-btn');
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();

      // Optimistic submission: textarea cleared immediately, remains interactive (not readonly), and no button loading spinner
      await expect(textarea).toHaveValue('', { timeout: 10000 });
      await expect(textarea).not.toHaveAttribute('readonly');
      await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 10000 });
    });

    await test.step('6. Assert comment card renders in drawer and ref updates on mock API', async () => {
      const commentCard = testPage
        .locator('#tab-page .md-comments-card-body')
        .filter({ hasText: 'Hermetic Playwright E2E Comment' });
      await expect(commentCard).toBeVisible({ timeout: 10000 });

      // Submitting progress line disappears once background write completes
      await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
        timeout: 10000,
      });

      // Assert that the mention rendered as an interactive link
      const mentionLink = commentCard
        .locator('a.md-comments-mention')
        .filter({ hasText: '@md-comments-test-mention' });
      await expect(mentionLink).toBeVisible();

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

      // Verify that notification commit comment was dispatched for @md-comments-test-mention
      await expect
        .poll(() => mockServer.commitComments.length, {
          timeout: 10000,
          intervals: [500, 1000],
        })
        .toBeGreaterThan(0);

      const notificationComment = mockServer.commitComments.find((c) =>
        c.body.includes('@md-comments-test-mention')
      );
      expect(notificationComment).toBeDefined();
    });

    await test.step('7. Select text in markdown paragraph and submit inline comment', async () => {
      // Clear previous commit comments on mock server to isolate inline notification assertion
      mockServer.commitComments = [];

      await testPage.evaluate(() => {
        const p = document.getElementById('p-1');
        if (!p) throw new Error('Paragraph #p-1 not found');
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

      // The inline composer wrapper in the drawer becomes visible
      const inlineComposer = testPage.locator('.new-inline-composer-wrapper');
      await expect(inlineComposer).toBeVisible({ timeout: 5000 });

      const inlineTextarea = testPage.locator(
        '.new-inline-composer-container .fallback-reply-textarea'
      );
      await expect(inlineTextarea).toBeVisible({ timeout: 5000 });

      const inlineCommentText =
        'Hermetic Inline E2E Comment: Anchored to paragraph mentioning @md-comments-test-mention.';
      await inlineTextarea.fill(inlineCommentText);

      const submitBtn = testPage.locator('.new-inline-composer-container .fallback-submit-btn');
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();

      // Assert inline composer UI is hidden immediately upon submission
      await expect(inlineComposer).toBeHidden();

      // Assert inline comment card appears in #tab-inline
      const inlineCard = testPage
        .locator('#tab-inline .md-comments-card-body')
        .filter({ hasText: 'Hermetic Inline E2E Comment' });
      await expect(inlineCard).toBeVisible({ timeout: 10000 });

      // Submitting progress line disappears once async commit finishes
      await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
        timeout: 10000,
      });

      const mentionLink = inlineCard
        .locator('a.md-comments-mention')
        .filter({ hasText: '@md-comments-test-mention' });
      await expect(mentionLink).toBeVisible();

      // Verify inline notification commit comment was dispatched
      await expect
        .poll(() => mockServer.commitComments.length, {
          timeout: 10000,
          intervals: [500, 1000],
        })
        .toBeGreaterThan(0);

      const inlineNotif = mockServer.commitComments.find((c) =>
        c.body.includes('@md-comments-test-mention')
      );
      expect(inlineNotif).toBeDefined();
    });

    await test.step('9. Assert optimistic comment editing with progress line', async () => {
      // Switch back to page tab
      const pageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
      await pageTabBtn.click();

      const pageCard = testPage.locator('#tab-page .md-comments-card').first();
      await expect(pageCard).toBeVisible();

      // Click Edit Comment button
      const editBtn = pageCard.locator('.edit-comment-btn');
      await expect(editBtn).toBeVisible();
      await editBtn.click();

      // Assert edit form and textarea appear
      const editTextarea = pageCard.locator('.comment-edit-textarea');
      await expect(editTextarea).toBeVisible();

      const updatedText =
        'Hermetic Playwright E2E Comment (Edited Optimistically with Progress Line)';
      await editTextarea.fill(updatedText);

      const saveBtn = pageCard.locator('.edit-save-btn');
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();

      // Assert editable form immediately disappears without waiting for async git write
      await expect(testPage.locator('.comment-edit-textarea')).toHaveCount(0);
      await expect(testPage.locator('.comment-edit-form')).toHaveCount(0);

      // Assert edited text rendered immediately in card body
      const cardBody = pageCard.locator('.md-comments-card-body');
      await expect(cardBody).toContainText('(Edited Optimistically with Progress Line)');

      // Submitting progress line disappears once background write completes
      await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
        timeout: 10000,
      });

      // Verify ref was updated on mock server
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

    await test.step('10. Assert optimistic reply editing with progress line and keyboard shortcut', async () => {
      const pageCard = testPage.locator('#tab-page .md-comments-card').first();
      const replyInput = pageCard.locator('.reply-input');
      await replyInput.click();

      const replyComposer = pageCard.locator('.reply-composer-wrapper textarea');
      await expect(replyComposer).toBeVisible();
      await replyComposer.fill('Original thread reply message');

      const submitReplyBtn = pageCard.locator('.reply-composer-wrapper .fallback-submit-btn');
      await submitReplyBtn.click();

      const replyItem = pageCard.locator('.reply-item').first();
      await expect(replyItem).toBeVisible({ timeout: 10000 });
      await expect(replyItem.locator('.reply-body')).toContainText('Original thread reply message');

      // Edit the reply
      const editReplyBtn = replyItem.locator('.edit-reply-btn');
      await editReplyBtn.click();

      const editReplyTextarea = replyItem.locator('.reply-edit-textarea');
      await expect(editReplyTextarea).toBeVisible();
      await editReplyTextarea.fill('Updated reply text (Optimistically Saved)');

      // Submit edit using Control+Enter keyboard shortcut
      await editReplyTextarea.press('Control+Enter');

      // Assert reply edit form immediately dismissed
      await expect(testPage.locator('.reply-edit-textarea')).toHaveCount(0);
      await expect(testPage.locator('.reply-edit-form')).toHaveCount(0);

      // Assert updated reply text immediately visible
      await expect(replyItem.locator('.reply-body')).toContainText('(Optimistically Saved)');

      // Submitting progress line disappears once background commit completes
      await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
        timeout: 10000,
      });
    });

    await test.step('11. Assert comment and reply deletion persistence across page refresh and zero 0000000 requests', async () => {
      // Auto-accept confirmation dialogs for deletion
      testPage.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const pageCard = testPage.locator('#tab-page .md-comments-card').first();
      const replyItem = pageCard.locator('.reply-item').first();
      const deleteReplyBtn = replyItem.locator('.delete-reply-btn');
      await expect(deleteReplyBtn).toBeVisible();
      await deleteReplyBtn.click();

      // Assert reply item disappears immediately
      await expect(replyItem).toBeHidden();

      // Wait for background write to finish
      await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
        timeout: 10000,
      });

      // Now delete the parent comment
      const deleteCommentBtn = pageCard.locator('.delete-comment-btn');
      await expect(deleteCommentBtn).toBeVisible();
      await deleteCommentBtn.click();

      // Assert comment card disappears immediately
      await expect(pageCard).toBeHidden();

      // Wait for background write to finish
      await expect(testPage.locator('.md-comments-submitting-line')).toHaveCount(0, {
        timeout: 10000,
      });

      // Refresh the page
      await testPage.reload({ waitUntil: 'load' });
      await expect(testPage.locator('.markdown-body')).toBeVisible();

      // Ensure sidebar is open (either auto-opened from persistent state or open via FAB)
      const drawer = testPage.locator('.md-comments-drawer, #md-comments-sidebar');
      const fab = testPage.locator('#md-comments-fab-toggle');
      await expect
        .poll(
          async () => {
            const isOpen = await testPage.evaluate(() => {
              const el = document.getElementById('md-comments-sidebar');
              return el?.style.transform === 'translateX(0px)';
            });
            if (isOpen) return true;
            if (await fab.isVisible()) {
              await fab.click();
              return true;
            }
            return false;
          },
          { timeout: 15000, intervals: [200, 500] }
        )
        .toBe(true);
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Switch to Page Comments tab
      const pageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
      await pageTabBtn.click();

      // Assert the deleted comment is completely gone (not resurrected)
      const pageCardsAfterReload = testPage.locator('#tab-page .md-comments-card');
      await expect(pageCardsAfterReload).toHaveCount(0);

      // Verify that 0000000 was NEVER requested or sent anywhere
      const hasZeroHashUrl = interceptedApiUrls.some((u) => u.includes('0000000'));
      expect(hasZeroHashUrl).toBe(false);

      const hasZeroHashBody = interceptedPostBodies.some((b) => b && b.includes('0000000'));
      expect(hasZeroHashBody).toBe(false);
    });

    await test.step('9. Verify silent refresh via refresh button activates progress line without UI churn', async () => {
      const refreshBtn = testPage.locator('#md-comments-sidebar .refresh-btn');
      await expect(refreshBtn).toBeVisible();

      // Click refresh button
      await refreshBtn.click();

      // Invariant: .installation-loading-card must NEVER be rendered on refresh
      const validatingCard = testPage.locator('.installation-loading-card');
      await expect(validatingCard).toHaveCount(0);

      // Verify progress line element exists and is anchored
      const progressLine = testPage.locator('#sidebar-refresh-progress-line');
      await expect(progressLine).toHaveCount(1);
    });
  });
});
