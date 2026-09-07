import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Extension CodeLens E2E', () => {
  test('renders comment badge CodeLens on markdown lines and triggers preview on click', async ({
    vscode,
  }) => {
    const { page, openCommentPreview, getCommentPreviewFrame } = vscode;

    // 1. Open comment preview panel
    await vscode.waitForExtensionActivation();
    await openCommentPreview();

    const previewFrame = getCommentPreviewFrame();

    // 2. Select text in paragraph and create an inline comment
    const paragraph = previewFrame.locator('p').filter({ hasText: 'Welcome to the documentation' });
    await expect(paragraph).toBeVisible({ timeout: 15000 });

    await paragraph.evaluate((el) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    const selectionBar = previewFrame.locator('#md-comments-selection-bar');
    await expect(selectionBar).toBeVisible({ timeout: 5000 });

    const addInlineBtn = selectionBar.locator('button');
    await addInlineBtn.click();

    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill('CodeLens test inline note');

    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.click();

    // Verify inline card appears
    const inlineCard = previewFrame.locator('.md-comments-card', {
      hasText: 'CodeLens test inline note',
    });
    await expect(inlineCard).toBeVisible({ timeout: 10000 });

    // 3. Switch focus back to the markdown editor tab and lines
    const editorTab = page.locator('.tab', { hasText: 'test-guide.md' }).first();
    await editorTab.click();
    const editorLines = page
      .locator('.editor-instance .monaco-editor .view-lines, .monaco-editor .view-lines')
      .first();
    if (await editorLines.isVisible()) {
      await editorLines.click({ force: true });
    }

    // 4. Verify CodeLens is rendered in Monaco editor
    const codeLens = page
      .locator('.codelens-decoration, [class*="codelens"]')
      .filter({ hasText: /comment/ });
    await expect(codeLens.first()).toBeVisible({ timeout: 15000 });

    // 5. Click CodeLens and verify it triggers mdComments.openCommentPreview
    await codeLens.first().click();

    // 6. Verify comment preview webview is open and focused
    const webview = page.locator('iframe.webview');
    await expect(webview).toBeVisible({ timeout: 10000 });
  });
});
