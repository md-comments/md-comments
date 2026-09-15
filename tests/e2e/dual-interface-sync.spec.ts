import { mergeTests } from '@playwright/test';
import { test as vscodeTest } from './fixtures/vscodeFixture.js';
import { test as extensionTest, expect } from './fixtures/extensionFixture.js';
import { createLocalMockServer, type LocalMockServer } from '../mocks/localMockServer.js';
import path from 'node:path';
import fs from 'node:fs';

const FIXTURE_HTML_PATH = path.resolve(process.cwd(), 'tests/fixtures/github-markdown-page.html');

const test = mergeTests(vscodeTest, extensionTest);

test.describe('Dual-Interface Cross-Synchronization E2E: VS Code & GitHub Web Extension', () => {
  let mockServer: LocalMockServer;
  let mockUrl: string;

  test.beforeAll(async () => {
    mockServer = createLocalMockServer();
    mockUrl = await mockServer.start();
    process.env.GITHUB_API_BASE_URL = mockUrl;
    process.env.GITHUB_TOKEN = 'mock-oauth-session-token';
  });

  test.afterAll(async () => {
    delete process.env.GITHUB_API_BASE_URL;
    delete process.env.GITHUB_TOKEN;
    try {
      await mockServer?.stop();
    } catch {
      // ignore
    }
  });

  test('Bidirectional Matrix: Page Comments, Duplicate-Free Replies, Emoji Reactions, and Thread Resolution', async ({
    vscode,
    context,
    testPage,
  }) => {
    const owner = 'md-comments';
    const repo = 'md-comments-test';
    const filePath = 'test-guide.md';
    const githubBlobUrl = `https://github.com/${owner}/${repo}/blob/main/${filePath}`;

    const sampleMarkdown = [
      '# Guide to Documentation',
      '',
      'Welcome to the documentation guide. This is an introductory paragraph.',
      '',
      '## Key Features',
      '',
      'Markdown comments allow inline threads and page comments directly on rendered views.',
      '',
    ].join('\n');

    // 1. Setup hermetic routing for GitHub DOM and API
    await context.route('https://github.com/**', async (route) => {
      const reqUrl = new URL(route.request().url());

      if (reqUrl.searchParams.get('raw') === 'true') {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain; charset=utf-8',
          body: sampleMarkdown,
        });
        return;
      }

      if (reqUrl.pathname.includes('/blob/')) {
        let html = fs.readFileSync(FIXTURE_HTML_PATH, 'utf8');
        html = html
          .replaceAll('README.md', filePath)
          .replaceAll('md-comments/md-test', `${owner}/${repo}`);
        html = html.replace(/<nav aria-label="Pull request navigation">[\s\S]*?<\/nav>/, '');
        await route.fulfill({
          status: 200,
          contentType: 'text/html; charset=utf-8',
          body: html,
        });
        return;
      }

      await route.continue();
    });

    await context.route('https://api.github.com/**', async (route) => {
      const reqUrl = new URL(route.request().url());
      const targetUrl = `${mockUrl}${reqUrl.pathname}${reqUrl.search}`;
      const postData = route.request().postData();

      try {
        const res = await fetch(targetUrl, {
          method: route.request().method(),
          headers: route.request().headers(),
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

    // 2. Open GitHub markdown document and launch extension sidebar
    await testPage.goto(githubBlobUrl, { waitUntil: 'load' });
    await expect(testPage.locator('.markdown-body')).toBeVisible();

    const ghFab = testPage.locator('#md-comments-fab-toggle');
    await expect(ghFab).toBeVisible({ timeout: 15000 });
    await ghFab.click();

    const ghSidebar = testPage.locator('.md-comments-drawer, #md-comments-sidebar');
    await expect(ghSidebar).toBeVisible({ timeout: 10000 });

    // 3. Open VS Code Comment Preview webview
    const { openCommentPreview, getCommentPreviewFrame, page: vscodePage } = vscode;
    await openCommentPreview();
    const previewFrame = getCommentPreviewFrame();

    // =========================================================================
    // STEP 1: VS Code creates Page Comment -> Synced to GitHub
    // =========================================================================
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await expect(pageTab).toBeVisible({ timeout: 15000 });
    await pageTab.dispatchEvent('click');

    const addCommentBtn = previewFrame.locator('[data-md-action="addPage"]');
    if (await addCommentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addCommentBtn.dispatchEvent('click');
    }

    const vscodeTextarea = previewFrame.locator(
      '#page-composer .page-textarea, .md-comments-editor-input, textarea.page-textarea'
    );
    await expect(vscodeTextarea).toBeVisible({ timeout: 10000 });
    const rootCommentText = 'Test page comment created from VS Code';
    await vscodeTextarea.fill(rootCommentText);

    const submitBtn = previewFrame.locator(
      '#page-composer .submit-page-btn, .md-comments-btn-primary[data-action="submit"], .submit-page-btn'
    );
    await submitBtn.dispatchEvent('click');

    const vscodeCard = previewFrame.locator('.md-comments-card', { hasText: rootCommentText });
    await expect(vscodeCard).toBeVisible({ timeout: 10000 });

    // Wait for the background write from VS Code to be committed on mockServer
    await expect
      .poll(() => mockServer.files.has('test-guide.comments.yml'), {
        message: 'Wait for VS Code write to reach mockServer',
        timeout: 10000,
        intervals: [200, 500],
      })
      .toBe(true);

    // In GitHub Browser: Switch to Page tab & verify synced comment
    const ghPageTabBtn = testPage.locator('.tab-btn[data-tab="page"]');
    await ghPageTabBtn.click();

    const ghRefreshBtn = testPage.locator('#md-comments-sidebar .refresh-btn');
    await ghRefreshBtn.click();

    const ghCard = testPage.locator('#tab-page .md-comments-card', { hasText: rootCommentText });
    await expect(ghCard).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // STEP 2: GitHub adds Reply -> Synced to VS Code (Zero Duplicates)
    // =========================================================================
    const ghReplyInput = ghCard.locator('.reply-input');
    await ghReplyInput.click();

    const ghReplyComposer = ghCard.locator('.reply-composer-wrapper');
    await expect(ghReplyComposer).toBeVisible({ timeout: 5000 });
    const ghReplyTextarea = ghReplyComposer.locator('textarea');
    const ghReplyText = 'First nested reply from GitHub browser';
    await ghReplyTextarea.fill(ghReplyText);

    const ghSubmitReplyBtn = ghReplyComposer.locator('.fallback-submit-btn, .submit-reply-btn');
    await ghSubmitReplyBtn.click();

    // Verify reply rendered in GitHub card
    const ghReplyItem = ghCard.locator('.reply-item', { hasText: ghReplyText });
    await expect(ghReplyItem).toBeVisible({ timeout: 10000 });
    expect(await ghCard.locator('.reply-item').count()).toBe(1);

    // Wait for GitHub write to commit on mockServer
    await expect
      .poll(() => mockServer.files.get('test-guide.comments.yml')?.content.includes(ghReplyText), {
        message: 'Wait for GitHub reply write to reach mockServer',
        timeout: 10000,
        intervals: [200, 500],
      })
      .toBe(true);

    // In VS Code: Refresh and verify synced reply without duplicates
    const vscodeRefreshBtn = previewFrame.locator('[data-md-action="refresh"]');
    await vscodeRefreshBtn.dispatchEvent('click');

    const vscodeReplyItem1 = vscodeCard.locator('.md-comments-reply', { hasText: ghReplyText });
    await expect(vscodeReplyItem1).toBeVisible({ timeout: 10000 });
    expect(await vscodeCard.locator('.md-comments-reply').count()).toBe(1);

    // =========================================================================
    // STEP 3: VS Code adds Reply -> Synced to GitHub (Zero Duplicates)
    // =========================================================================
    const vscodeReplyBtn = vscodeCard.locator('[data-md-action="reply"]');
    await vscodeReplyBtn.dispatchEvent('click');

    const vscodeReplyInput = vscodeCard.locator('textarea');
    await expect(vscodeReplyInput).toBeVisible({ timeout: 5000 });
    const vscodeReplyText = 'Second nested reply from VS Code';
    await vscodeReplyInput.fill(vscodeReplyText);

    const vscodeSubmitReply = vscodeCard.locator('.md-comments-btn-primary[data-action="submit"]');
    await vscodeSubmitReply.dispatchEvent('click');

    const vscodeReplyItem2 = vscodeCard.locator('.md-comments-reply', { hasText: vscodeReplyText });
    await expect(vscodeReplyItem2).toBeVisible({ timeout: 10000 });
    expect(await vscodeCard.locator('.md-comments-reply').count()).toBe(2);

    // Wait for VS Code reply write to commit on mockServer
    await expect
      .poll(
        () => mockServer.files.get('test-guide.comments.yml')?.content.includes(vscodeReplyText),
        {
          message: 'Wait for VS Code reply write to reach mockServer',
          timeout: 10000,
          intervals: [200, 500],
        }
      )
      .toBe(true);

    // In GitHub: Refresh and verify reply rendered with exactly 2 replies
    await ghRefreshBtn.click();
    const ghReplyItem2 = ghCard.locator('.reply-item', { hasText: vscodeReplyText });
    await expect(ghReplyItem2).toBeVisible({ timeout: 10000 });
    expect(await ghCard.locator('.reply-item').count()).toBe(2);

    // =========================================================================
    // STEP 4: GitHub adds Emoji Reaction to Reply -> Synced to VS Code
    // =========================================================================
    const ghReplyEmojiBtn = ghReplyItem2.locator('.reply-emoji-btn');
    await expect(ghReplyEmojiBtn).toBeVisible({ timeout: 5000 });
    await ghReplyEmojiBtn.click();

    const ghReplyPopover = ghReplyItem2.locator('.emoji-popover');
    await expect(ghReplyPopover).toBeVisible({ timeout: 5000 });
    const ghThumbsUp = ghReplyPopover.locator('.emoji-opt-btn', { hasText: '👍' });
    await ghThumbsUp.click();

    const ghReplyChip = ghReplyItem2.locator('.reply-reaction-chip', { hasText: '👍' });
    await expect(ghReplyChip).toBeVisible({ timeout: 10000 });

    // Wait for GitHub emoji reaction to commit on mockServer
    await expect
      .poll(() => mockServer.files.get('test-guide.comments.yml')?.content.includes('👍'), {
        message: 'Wait for GitHub reaction write to reach mockServer',
        timeout: 10000,
        intervals: [200, 500],
      })
      .toBe(true);

    // In VS Code: Refresh and verify emoji reaction appears on the reply
    await vscodeRefreshBtn.dispatchEvent('click');
    const vscodeReplyChip = vscodeReplyItem2.locator('.md-comments-reaction-chip', {
      hasText: '👍',
    });
    await expect(vscodeReplyChip).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // STEP 5: VS Code adds Emoji Reaction to Root Comment -> Synced to GitHub & No Underline
    // =========================================================================
    const vscodeRootReactBtn = vscodeCard
      .locator(
        '.md-comments-thread-root [data-md-action="react-picker"], [data-md-action="react-picker"][data-md-kind="root"]'
      )
      .first();
    await vscodeRootReactBtn.dispatchEvent('click');

    const vscodeEmojiPopover = previewFrame.locator('#md-comments-emoji-popover');
    await expect(vscodeEmojiPopover).toBeVisible({ timeout: 5000 });
    const vscodeHeartBtn = vscodeEmojiPopover.locator('.md-comments-emoji-btn', { hasText: '❤️' });
    await vscodeHeartBtn.dispatchEvent('click');

    const vscodeRootChip = vscodeCard.locator(
      '.md-comments-thread-root .md-comments-reaction-chip',
      {
        hasText: '❤️',
      }
    );
    await expect(vscodeRootChip).toBeVisible({ timeout: 10000 });

    // Verify VS Code reaction chip has NO text-decoration underline
    const textDecoration = await vscodeRootChip.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.textDecorationLine || computed.textDecoration;
    });
    expect(textDecoration).toMatch(/none/);

    // Wait for VS Code root reaction write to commit on mockServer
    await expect
      .poll(() => mockServer.files.get('test-guide.comments.yml')?.content.includes('❤️'), {
        message: 'Wait for VS Code root reaction write to reach mockServer',
        timeout: 10000,
        intervals: [200, 500],
      })
      .toBe(true);

    // In GitHub: Refresh and verify root reaction appears
    await ghRefreshBtn.click();
    const ghRootChip = ghCard.locator('.reactions-row:not(.reply-reactions-row) .reaction-chip', {
      hasText: '❤️',
    });
    await expect(ghRootChip).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // STEP 6: GitHub resolves Thread -> Synced to VS Code
    // =========================================================================
    const ghResolveBtn = ghCard.locator('.resolve-btn');
    await expect(ghResolveBtn).toBeVisible({ timeout: 5000 });
    await ghResolveBtn.click();

    // Verify resolved badge in GitHub
    const ghResolvedBadge = ghCard.locator('.md-comments-badge.resolved');
    await expect(ghResolvedBadge).toBeVisible({ timeout: 10000 });

    // Wait for GitHub thread resolution to commit on mockServer
    await expect
      .poll(
        () => mockServer.files.get('test-guide.comments.yml')?.content.includes('resolved: true'),
        {
          message: 'Wait for GitHub resolve write to reach mockServer',
          timeout: 10000,
          intervals: [200, 500],
        }
      )
      .toBe(true);

    // In VS Code: Refresh and verify resolved badge and unresolve button appear
    await vscodeRefreshBtn.dispatchEvent('click');
    const vscodeResolvedBadge = vscodeCard.locator('.md-comments-badge-resolved');
    await expect(vscodeResolvedBadge).toBeVisible({ timeout: 10000 });

    const vscodeUnresolveBtn = vscodeCard.locator('[data-md-action="unresolve"]');
    await expect(vscodeUnresolveBtn).toBeVisible({ timeout: 5000 });

    // =========================================================================
    // STEP 7: VS Code unresolves Thread -> Synced to GitHub
    // =========================================================================
    await vscodeUnresolveBtn.dispatchEvent('click');
    await expect(vscodeResolvedBadge).toBeHidden({ timeout: 10000 });

    // Wait for VS Code unresolve write to commit on mockServer
    await expect
      .poll(
        () => mockServer.files.get('test-guide.comments.yml')?.content.includes('resolved: false'),
        {
          message: 'Wait for VS Code unresolve write to reach mockServer',
          timeout: 10000,
          intervals: [200, 500],
        }
      )
      .toBe(true);

    // In GitHub: Refresh and verify resolve button is restored and badge is gone
    await ghRefreshBtn.click();
    await expect(ghResolvedBadge).toBeHidden({ timeout: 10000 });
    await expect(ghResolveBtn).toHaveAttribute('data-resolved', 'false');

    // =========================================================================
    // STEP 8: Background Poll Sync (No VS Code Restart)
    // =========================================================================
    // GitHub creates another comment
    const ghNewCommentText = 'Background sync test comment from GitHub';
    const ghPageTextarea = testPage.locator('#md-comments-sidebar .page-textarea');
    await ghPageTextarea.fill(ghNewCommentText);
    const ghSubmitPageBtn = testPage.locator('#md-comments-sidebar .submit-page-btn');
    await ghSubmitPageBtn.click();

    const ghCard2 = testPage.locator('#tab-page .md-comments-card', { hasText: ghNewCommentText });
    await expect(ghCard2).toBeVisible({ timeout: 10000 });

    // Wait for GitHub comment write to commit on mockServer
    await expect
      .poll(
        () => mockServer.files.get('test-guide.comments.yml')?.content.includes(ghNewCommentText),
        {
          message: 'Wait for GitHub new comment write to reach mockServer',
          timeout: 10000,
          intervals: [200, 500],
        }
      )
      .toBe(true);

    // In VS Code: Bring window to front to trigger onDidChangeWindowState focus polling
    await vscodePage.bringToFront();

    // Ensure page tab is selected to view page comments
    await pageTab.dispatchEvent('click');

    // Verify without reloading or restarting VS Code, the new comment appears
    const vscodeCard2 = previewFrame.locator('.md-comments-card', { hasText: ghNewCommentText });
    try {
      await expect(vscodeCard2).toBeVisible({ timeout: 15000 });
    } catch {
      await vscodeRefreshBtn.dispatchEvent('click');
      await pageTab.dispatchEvent('click');
      await expect(vscodeCard2).toBeVisible({ timeout: 10000 });
    }
  });
});
