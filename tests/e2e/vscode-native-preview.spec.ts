import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Native Markdown Preview Integration E2E', () => {
  test('injects markdown preview scripts, renders floating FAB, and toggles comments drawer in native preview', async ({
    vscode,
  }) => {
    const { runCommand, getCommentPreviewFrame } = vscode;

    // 1. Open native Markdown preview to side via Command Palette
    await runCommand('Markdown: Open Preview to the Side');

    // 2. Locate native markdown preview iframe
    const previewFrame = getCommentPreviewFrame();

    // Verify document rendered inside native preview
    const docTitle = previewFrame.locator('h1');
    await expect(docTitle).toBeVisible({ timeout: 15000 });
    await expect(docTitle).toHaveText('Guide to Documentation');

    // 3. Verify floating action button (FAB) contributed by markdown.previewScripts
    const fab = previewFrame.locator('#md-comments-panel-fab');
    await expect(fab).toBeVisible({ timeout: 10000 });
    const fabSvg = fab.locator('svg.md-comments-fab-icon');
    await expect(fabSvg).toHaveAttribute('viewBox', '0 0 512 512');

    // 4. Verify comments sidebar layout container
    const layout = previewFrame.locator('#md-comments-layout');
    await expect(layout).toBeVisible({ timeout: 5000 });

    // 5. Click FAB to open the sidebar drawer
    await fab.dispatchEvent('click');

    // 6. Verify layout gets md-comments-sidebar-open class and fab aria-expanded is true
    await expect(layout).toHaveClass(/md-comments-sidebar-open/, { timeout: 5000 });
    await expect(fab).toHaveAttribute('aria-expanded', 'true');

    // 7. Verify comments sidebar drawer is visible
    const sidebar = previewFrame.locator('#md-comments-sidebar');
    await expect(sidebar).toBeVisible();

    // 8. Verify save hint notice in native preview (pointing to custom Comment Preview Panel)
    const saveHint = previewFrame.locator('.md-comments-save-hint');
    await expect(saveHint).toBeVisible();
    await expect(saveHint).toContainText('Saving comments');
  });
});
