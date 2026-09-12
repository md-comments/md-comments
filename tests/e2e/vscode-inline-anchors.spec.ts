import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension Inline Anchoring E2E', () => {
  test('creates an inline comment from text selection and renders quote excerpt', async ({
    vscode,
  }) => {
    const { openCommentPreview, getCommentPreviewFrame } = vscode;

    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // Verify markdown document is rendered
    const firstP = previewFrame.locator('p').first();
    await expect(firstP).toBeVisible({ timeout: 15000 });
    await expect(firstP).toContainText('Welcome to the documentation guide.');

    // Select text within the paragraph to trigger selection bar
    await firstP.evaluate((p) => {
      const range = document.createRange();
      range.selectNodeContents(p);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    // Selection floating bar appears
    const selectionBar = previewFrame.locator('#md-comments-selection-bar');
    await expect(selectionBar).toBeVisible({ timeout: 5000 });

    // Click "Add comment" button on the selection bar
    const addInlineBtn = selectionBar.locator('button');
    await addInlineBtn.dispatchEvent('click');

    // Inline composer should open in the sidebar with quote excerpt
    const quoteExcerpt = previewFrame.locator('.md-comments-quote-excerpt');
    await expect(quoteExcerpt).toBeVisible({ timeout: 5000 });
    await expect(quoteExcerpt).toContainText('Welcome to the documentation guide.');

    // Enter inline comment text
    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible();
    const commentBody = 'Inline review: clear introductory paragraph.';
    await textarea.fill(commentBody);

    // Submit inline comment
    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.dispatchEvent('click');

    // Verify inline card appears under the Inline tab
    const inlineCard = previewFrame.locator('.md-comments-card', { hasText: commentBody });
    await expect(inlineCard).toBeVisible({ timeout: 10000 });

    // Verify paragraph is marked with anchor class
    const markedP = previewFrame.locator('.md-comments-paragraph-marked, p[data-md-comment-id]');
    await expect(markedP.first()).toBeVisible({ timeout: 5000 });
  });
});
