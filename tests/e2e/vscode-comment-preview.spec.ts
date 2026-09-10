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

    // 2. Verify comments sidebar is rendered
    const sidebar = previewFrame.locator('#md-comments-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 3. Switch to Page Comments tab
    const pageTab = previewFrame.locator('.md-comments-tab[data-tab="page"]');
    await expect(pageTab).toBeVisible({ timeout: 5000 });
    await pageTab.dispatchEvent('click');

    // 4. Trigger comment composer
    const addCommentBtn = previewFrame.locator('[data-md-action="addPage"]');
    await expect(addCommentBtn).toBeVisible({ timeout: 5000 });
    await addCommentBtn.dispatchEvent('click');

    // 5. Fill and submit comment
    const textarea = previewFrame.locator('.md-comments-editor-input');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const commentBody = 'E2E verified comment via Playwright Electron runner';
    await textarea.fill(commentBody);

    const submitBtn = previewFrame.locator('.md-comments-btn-primary[data-action="submit"]');
    await submitBtn.dispatchEvent('click');

    // 6. Assert comment card appears in sidebar
    const commentCard = previewFrame.locator('.md-comments-card', { hasText: commentBody });
    await expect(commentCard).toBeVisible({ timeout: 10000 });
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
  });
});
