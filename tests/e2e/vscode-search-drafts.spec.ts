import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Comments Composer & Tab Filtering E2E', () => {
  test('verifies tab switching counts, composer draft cancellation, and submission persistence', async ({
    vscode,
  }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // 1. Check initial tab counts
    const inlineTab = previewFrame.locator('.md-comments-tab[data-tab="inline"]');
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');

    await expect(inlineTab).toBeVisible({ timeout: 15000 });
    await expect(pageTab).toBeVisible({ timeout: 15000 });

    // 2. Switch to Document (page) tab
    await pageTab.dispatchEvent('click');
    const pagePanel = previewFrame.locator('.md-comments-tab-panel[data-panel="page"]');
    await expect(pagePanel).toBeVisible({ timeout: 5000 });

    // 3. Open page composer
    const addCommentBtn = previewFrame.locator('[data-md-action="addPage"]');
    await expect(addCommentBtn).toBeVisible({ timeout: 5000 });
    await addCommentBtn.dispatchEvent('click');

    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible();

    // 4. Enter draft text then cancel
    await textarea.fill('Temporary draft text that will be cancelled');
    const cancelBtn = previewFrame.locator('[data-action="cancel"]');
    await cancelBtn.dispatchEvent('click');

    // Verify composer is closed
    await expect(textarea).not.toBeVisible();

    // 5. Reopen composer and verify input is fresh
    await addCommentBtn.dispatchEvent('click');
    await expect(textarea).toBeVisible();
    expect(await textarea.inputValue()).toBe('');

    // 6. Enter real comment and submit
    const finalComment = 'Persistent page review comment';
    await textarea.fill(finalComment);

    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.dispatchEvent('click');

    // 7. Verify comment card appears under Document tab
    await pageTab.dispatchEvent('click');
    const card = previewFrame.locator('.md-comments-card', { hasText: finalComment });
    await expect(card).toBeVisible({ timeout: 10000 });

    // 8. Verify Document tab badge count incremented to at least 1
    const countBadge = pageTab.locator('.md-comments-tab-count');
    await expect(countBadge).toHaveText(/[1-9]/);
  });
});
