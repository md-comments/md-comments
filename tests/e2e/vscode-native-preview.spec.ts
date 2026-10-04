import { test, expect } from './fixtures/vscodeFixture';

test.describe('VS Code Native Markdown Preview Integration E2E', () => {
  test('renders markdown document with markdown-it decoration and save hint in native preview', async ({
    vscode,
  }) => {
    const { runCommand, getCommentPreviewFrame } = vscode;

    // 1. Open native Markdown preview to side via Command Palette
    await runCommand('Markdown: Open Preview to the Side');

    // 2. Locate native markdown preview iframe
    const previewFrame = getCommentPreviewFrame();

    // 3. Verify document rendered inside native preview
    const docTitle = previewFrame.locator('h1');
    await expect(docTitle).toBeVisible({ timeout: 15000 });
    await expect(docTitle).toHaveText('Guide to Documentation');

    const keyFeaturesHeading = previewFrame.getByRole('heading', { name: 'Key Features' });
    await expect(keyFeaturesHeading).toBeVisible({ timeout: 10000 });

    // 4. Verify comments sidebar layout container is attached
    const layout = previewFrame.locator('#md-comments-layout');
    await expect(layout).toBeAttached({ timeout: 5000 });

    // 5. Verify save hint notice is displayed in native preview pointing to standalone preview
    const saveHint = previewFrame.locator('.md-comments-save-hint');
    await expect(saveHint).toBeVisible({ timeout: 5000 });
    await expect(saveHint).toContainText('Saving comments');
    await expect(saveHint).toContainText('Open Comment Preview');

    // 6. Verify main markdown document container is intact (not blank or collapsed)
    const mainDoc = previewFrame.locator('.md-comments-document');
    await expect(mainDoc).toBeVisible({ timeout: 5000 });
  });
});
