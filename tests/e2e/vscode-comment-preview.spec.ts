import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension Comment Preview E2E', () => {
  test('opens comment preview webview beside editor, submits page comment, and renders thread card', async ({
    vscode,
  }) => {
    const { page, openCommentPreview, getCommentPreviewFrame } = vscode;

    // Verify workbench is active
    await expect(page.locator('.monaco-workbench')).toBeVisible({ timeout: 15000 });

    // Open comment preview panel
    await openCommentPreview();

    // Verify webview container is loaded in workbench
    const webviewOuter = page.locator('iframe.webview');
    await expect(webviewOuter).toBeVisible({ timeout: 15000 });

    // Locate the inner webview content frame
    const previewFrame = getCommentPreviewFrame();

    // 1. Verify markdown document rendered inside the webview
    const docTitle = previewFrame.locator('h1');
    await expect(docTitle).toBeVisible({ timeout: 15000 });
    await expect(docTitle).toHaveText('Guide to Documentation');

    const keyFeaturesHeading = previewFrame.getByRole('heading', { name: 'Key Features' });
    await expect(keyFeaturesHeading).toBeVisible();

    // 2. Verify comments sidebar is rendered and open via FAB if closed
    const sidebar = previewFrame.locator('#md-comments-sidebar');
    await expect(sidebar).toBeAttached({ timeout: 10000 });
    const fab = previewFrame.locator('#md-comments-panel-fab');
    if (await fab.isVisible()) {
      await fab.dispatchEvent('click');
    }

    // 3. Switch to Page Comments tab
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await expect(pageTab).toBeVisible({ timeout: 5000 });
    await pageTab.dispatchEvent('click');

    // Verify redundant footer button was removed from document tab
    const legacyFooterBtn = previewFrame.locator(
      '.md-comments-sidebar-footer [data-md-action="addPage"]'
    );
    await expect(legacyFooterBtn).toHaveCount(0);

    // 4. Fill and submit comment using dedicated Page Composer
    const textarea = previewFrame.locator('#page-composer .page-textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const commentBody = 'E2E verified comment via Playwright Electron runner';
    await textarea.fill(commentBody);

    const submitBtn = previewFrame.locator('#page-composer .submit-page-btn');
    await submitBtn.dispatchEvent('click');

    // 5. Assert comment card appears optimistically and is scrolled into viewport
    const commentCard = previewFrame.locator('.md-comments-card', { hasText: commentBody });
    await expect(commentCard).toBeVisible({ timeout: 2000 });
    await expect(commentCard).toBeInViewport();

    // 6. Assert pointer cursor on comment card
    const cardCursor = await commentCard.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cardCursor).toBe('pointer');

    // 7. Verify no disruptive notification toast is shown in workbench
    const notifications = page.locator('.monaco-notification-toast, .notifications-toasts');
    await expect(notifications).toHaveCount(0);

    // 8. Test reply action on first click without scroll interception
    const replyBtn = commentCard.locator('[data-md-action="reply"]').first();
    await replyBtn.dispatchEvent('click');

    const replyComposer = commentCard.locator(
      '.reply-composer-wrapper, .md-comments-panel-composer'
    );
    await expect(replyComposer).toBeVisible({ timeout: 3000 });

    const replyTextarea = replyComposer.locator('textarea');
    await replyTextarea.fill('Instant reply test');

    const replySubmitBtn = replyComposer.locator(
      'button[data-action="submit"], .fallback-submit-btn'
    );
    await replySubmitBtn.dispatchEvent('click');

    // Verify reply submit button does not remain stuck in loading spinner
    await expect(replySubmitBtn).not.toHaveClass(/loading/, { timeout: 4500 });
  });

  test('verifies inline paragraph comment anchors in rendered webview', async ({ vscode }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // In rendered preview, document container is present
    const docContainer = previewFrame.locator('.md-comments-document, #md-comments-layout');
    await expect(docContainer.first()).toBeVisible({ timeout: 15000 });

    // Check paragraphs rendered
    const paragraphs = previewFrame.locator('p');
    await expect(paragraphs.first()).toBeVisible({ timeout: 10000 });
    const firstPText = await paragraphs.first().innerText();
    expect(firstPText).toContain('Welcome to the documentation guide.');
  });

  test('verifies high-fidelity VS Code markdown styling, theme class, and MD FAB in preview', async ({
    vscode,
  }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // Verify vscode-markdown.css is linked in the webview head
    const mdCssLink = previewFrame.locator('link[href*="vscode-markdown.css"]');
    await expect(mdCssLink).toHaveCount(1);

    // Verify theme class is applied on the body (vscode-dark or vscode-light)
    const body = previewFrame.locator('body');
    await expect(body).toHaveClass(/vscode-(dark|light|high-contrast)/);

    // Verify MD Comments FAB is present and toggles the comments sidebar
    const fab = previewFrame.locator('#md-comments-panel-fab');
    await expect(fab).toBeVisible({ timeout: 10000 });

    const layout = previewFrame.locator('#md-comments-layout');
    await expect(layout).toBeVisible();

    // Click FAB to toggle sidebar
    await fab.dispatchEvent('click');
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    await expect(layout).toHaveClass(/md-comments-sidebar-open/);
    await expect(fab).toBeHidden();
  });
});
